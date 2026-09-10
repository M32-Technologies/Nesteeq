import { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import { VisitorParkingAssignmentModel, VisitorParkingSlotModel } from "./parking.model.js"
import type {
  GenerateParkingSlotsInput,
  UpdateParkingSlotInput,
} from "./parking.schema.js"
import {
  enrichSlots,
  getParkingSummary,
  isDuplicateKeyError,
  normalizeText,
  type LeanParkingSlot,
} from "./parking-shared.js"

const assertParkingSlotId = (slotId: string) => {
  if (!Types.ObjectId.isValid(slotId)) {
    throw new AppError("Invalid parking slot ID", 400)
  }
}

export const createParkingSlotService = async ({
  apartmentId,
  slotNumber,
  notes,
}: {
  apartmentId: string
  slotNumber: string
  notes?: string
}) => {
  try {
    const slot = await VisitorParkingSlotModel.create({
      apartmentId,
      slotNumber: slotNumber.toUpperCase(),
      status: VisitorParkingSlotStatus.AVAILABLE,
      notes: normalizeText(notes),
    })

    const records = await enrichSlots(apartmentId, [
      slot.toObject() as LeanParkingSlot,
    ])

    return records[0]
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "Parking slot already exists for this apartment",
        409
      )
    }

    throw error
  }
}

export const listParkingSlotsService = async ({
  apartmentId,
  status = "ALL",
  search,
  page = 1,
  limit = 10,
}: {
  apartmentId: string
  status?: "ALL" | VisitorParkingSlotStatusType
  search?: string
  page?: number
  limit?: number
}) => {
  const filter: Record<string, unknown> = { apartmentId }

  if (status !== "ALL") {
    filter.status = status
  }

  const trimmedSearch = search?.trim()

  if (trimmedSearch) {
    filter.slotNumber = new RegExp(escapeRegExp(trimmedSearch), "i")
  }

  const skip = (page - 1) * limit
  const [slots, totalCount, summary] = await Promise.all([
    VisitorParkingSlotModel.find(filter)
      .sort({ slotNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<LeanParkingSlot[]>,
    VisitorParkingSlotModel.countDocuments(filter),
    getParkingSummary(apartmentId),
  ])
  const totalPages = Math.ceil(totalCount / limit)

  return {
    summary,
    slots: await enrichSlots(apartmentId, slots),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  }
}

export const updateParkingSlotStatusService = async ({
  apartmentId,
  userId,
  slotId,
  status,
  notes,
}: {
  apartmentId: string
  userId: string
  slotId: string
  status: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">
  notes?: string
}) => {
  assertParkingSlotId(slotId)

  const slot = await VisitorParkingSlotModel.findOne({
    _id: slotId,
    apartmentId,
  })

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  await VisitorParkingAssignmentModel.updateMany(
    {
      apartmentId,
      slotId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
    },
    {
      $set: {
        status: VisitorParkingAssignmentStatus.RELEASED,
        releasedBy: userId,
        releasedAt: new Date(),
      },
    }
  )

  slot.status = status
  slot.notes = normalizeText(notes)
  await slot.save()

  const records = await enrichSlots(apartmentId, [
    slot.toObject() as LeanParkingSlot,
  ])

  return records[0]
}

export const generateParkingSlotsService = async (
  { prefix, totalSlots, startNumber = 1 }: GenerateParkingSlotsInput,
  apartmentId: string
) => {
  if (!apartmentId || !Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment context is required", 400)
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId)
  const normalizedPrefix = prefix.trim().toUpperCase()

  if (!normalizedPrefix) {
    throw new AppError("Parking slot prefix is required", 400)
  }

  const endNumber = startNumber + totalSlots - 1
  const slotNumbers: string[] = []

  for (let number = startNumber; number <= endNumber; number += 1) {
    slotNumbers.push(`${normalizedPrefix}-${String(number).padStart(3, "0")}`)
  }

  try {
    const duplicate = await VisitorParkingSlotModel.findOne({
      apartmentId: apartmentObjectId,
      slotNumber: { $in: slotNumbers },
    })
      .select("_id slotNumber")
      .lean<{ _id: Types.ObjectId; slotNumber: string }>()

    if (duplicate) {
      throw new AppError(
        `Generated parking slot already exists: ${duplicate.slotNumber}`,
        409
      )
    }

    const inserted = await VisitorParkingSlotModel.insertMany(
      slotNumbers.map((slotNumber) => ({
        apartmentId: apartmentObjectId,
        slotNumber,
        status: VisitorParkingSlotStatus.AVAILABLE,
        notes: null,
      })),
      { ordered: true }
    )

    const generatedSlots = inserted.map((slot) => ({
      id: slot._id.toString(),
      slotNumber: slot.slotNumber,
      status: slot.status,
      notes: slot.notes ?? null,
    }))

    return {
      prefix: normalizedPrefix,
      startNumber,
      endNumber,
      totalSlotsGenerated: generatedSlots.length,
      generatedSlots,
    }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error
    }

    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "One or more generated parking slots already exist",
        409
      )
    }

    throw new AppError("Parking slot generation failed", 500)
  }
}

export const updateParkingSlotService = async ({
  apartmentId,
  slotId,
  slotNumber,
  notes,
}: {
  apartmentId: string
  slotId: string
} & UpdateParkingSlotInput) => {
  assertParkingSlotId(slotId)

  const slot = await VisitorParkingSlotModel.findOne({
    _id: slotId,
    apartmentId,
  })

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  if (slotNumber !== undefined) {
    const normalizedSlotNumber = slotNumber.trim().toUpperCase()

    if (!normalizedSlotNumber) {
      throw new AppError("Slot number cannot be empty", 400)
    }

    if (normalizedSlotNumber !== slot.slotNumber) {
      const duplicate = await VisitorParkingSlotModel.exists({
        _id: { $ne: slot._id },
        apartmentId,
        slotNumber: normalizedSlotNumber,
      })

      if (duplicate) {
        throw new AppError(
          "Parking slot number already exists for this apartment",
          409
        )
      }

      slot.slotNumber = normalizedSlotNumber
    }
  }

  if (notes !== undefined) {
    slot.notes = normalizeText(notes)
  }

  try {
    await slot.save()
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "Parking slot number already exists for this apartment",
        409
      )
    }
    throw error
  }

  const [updatedSlot] = await enrichSlots(apartmentId, [
    slot.toObject() as LeanParkingSlot,
  ])

  return updatedSlot
}
