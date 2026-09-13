import { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import {
  assertParkingSlotId,
  duplicateKeyPatternIncludes,
  enrichSlots,
  ensureParkingSlotCanBeAssigned,
  getLinkedVisitorVisit,
  isDuplicateKeyError,
  normalizeText,
  normalizeVehicleNumber,
  parkingObjectId,
  toId,
} from "../../utils/parking.js"
import {
  claimSecurityVisitorParkingSlot,
  findSecurityVisitorParkingSlot,
  listSecurityVisitorParkingSlots,
  releaseSecurityVisitorParkingSlot,
  rollbackSecurityVisitorParkingSlot,
  setSecurityVisitorParkingSlotStatus,
} from "../../utils/security-visitor-parking.js"
import { ensureFlatInApartment } from "../../utils/security/directory.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type LeanParkingAssignment,
  type LeanParkingSlot,
  type ParkingVehicleType,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "./parking.model.js"
import type {
  GenerateParkingSlotsInput,
  UpdateParkingSlotInput,
} from "./parking.schema.js"

export { normalizeVehicleNumber }
export {
  assignResidentParking,
  generateParkingSlots,
  getParkingSlotById,
  getParkingSlots,
  getParkingStats,
  releaseResidentParking,
  updateParkingSlot,
  updateParkingSlotStatus,
} from "../../utils/parking-manager.js"

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

    return (await enrichSlots(apartmentId, [
      slot.toObject() as LeanParkingSlot,
    ]))[0]
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
  vehicleType,
  search,
  page = 1,
  limit = 10,
}: {
  apartmentId: string
  status?: "ALL" | VisitorParkingSlotStatusType
  vehicleType?: ParkingVehicleType
  search?: string
  page?: number
  limit?: number
}) => {
  const { slots, totalCount, summary } =
    await listSecurityVisitorParkingSlots({
      apartmentId,
      status,
      vehicleType,
      search,
      page,
      limit,
    })

  return {
    summary,
    slots: await enrichSlots(apartmentId, slots),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
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
  const slot = await setSecurityVisitorParkingSlotStatus({
    apartmentId,
    slotId,
    status,
    notes,
  })
  if (!slot) throw new AppError("Parking slot not found", 404)

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

  return (await enrichSlots(apartmentId, [slot]))[0]
}

export const generateParkingSlotsService = async (
  { prefix, totalSlots, startNumber = 1 }: GenerateParkingSlotsInput,
  apartmentId: string
) => {
  const apartmentObjectId = parkingObjectId(apartmentId, "apartment id")
  const normalizedPrefix = prefix.trim().toUpperCase()
  const endNumber = startNumber + totalSlots - 1
  const slotNumbers = Array.from(
    { length: totalSlots },
    (_, index) =>
      `${normalizedPrefix}-${String(startNumber + index).padStart(3, "0")}`
  )

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

    return {
      prefix: normalizedPrefix,
      startNumber,
      endNumber,
      totalSlotsGenerated: inserted.length,
      generatedSlots: inserted.map((slot) => ({
        id: slot._id.toString(),
        slotNumber: slot.slotNumber,
        status: slot.status,
        notes: slot.notes ?? null,
      })),
    }
  } catch (error: unknown) {
    if (error instanceof AppError) throw error
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
  if (!slot) throw new AppError("Parking slot not found", 404)

  if (slotNumber !== undefined) {
    const normalizedSlotNumber = slotNumber.trim().toUpperCase()
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

  if (notes !== undefined) slot.notes = normalizeText(notes)
  await slot.save()

  return (await enrichSlots(apartmentId, [
    slot.toObject() as LeanParkingSlot,
  ]))[0]
}

export const assignParkingSlotService = async ({
  apartmentId,
  userId,
  slotId,
  flatId,
  visitorVisitId,
  visitorName,
  vehicleNumber,
  vehicleType,
  notes,
}: {
  apartmentId: string
  userId: string
  slotId: string
  flatId: string
  visitorVisitId?: string
  visitorName: string
  vehicleNumber: string
  vehicleType: ParkingVehicleType
  notes?: string
}) => {
  assertParkingSlotId(slotId)
  await ensureFlatInApartment({ apartmentId, flatId })

  const linkedVisitorVisit = await getLinkedVisitorVisit({
    apartmentId,
    flatId,
    visitorVisitId,
  })
  const visitorVisitObjectId = linkedVisitorVisit
    ? new Types.ObjectId(toId(linkedVisitorVisit._id))
    : null
  const guestPassObjectId = linkedVisitorVisit?.visitorPassId
    ? new Types.ObjectId(toId(linkedVisitorVisit.visitorPassId))
    : null
  const assignmentVehicleNumber = normalizeVehicleNumber(vehicleNumber)
  const slot = await findSecurityVisitorParkingSlot({
    apartmentId,
    slotId,
  })

  if (!slot) throw new AppError("Parking slot not found", 404)
  const slotVehicleType = slot.vehicleType ?? "OTHER"
  if (slotVehicleType !== vehicleType) {
    throw new AppError(
      "Selected parking slot does not match vehicle type",
      400
    )
  }

  await ensureParkingSlotCanBeAssigned({
    apartmentId,
    slotId,
    slotStatus: slot.status,
    visitorVisitId: visitorVisitObjectId,
    vehicleNumber: assignmentVehicleNumber,
  })

  const claimedSlot = await claimSecurityVisitorParkingSlot({
    apartmentId,
    slotId,
    vehicleNumber: assignmentVehicleNumber,
  })

  if (!claimedSlot) {
    throw new AppError("Parking slot is no longer available", 409)
  }

  try {
    const assignment = await VisitorParkingAssignmentModel.create({
      apartmentId,
      slotId,
      flatId,
      visitorVisitId: visitorVisitObjectId,
      guestPassId: guestPassObjectId,
      visitorName: linkedVisitorVisit?.visitorName ?? visitorName,
      vehicleNumber: assignmentVehicleNumber,
      vehicleType,
      notes: normalizeText(notes),
      status: VisitorParkingAssignmentStatus.ACTIVE,
      assignedBy: userId,
      assignedAt: new Date(),
    })

    return assignment.toObject() as LeanParkingAssignment
  } catch (error: unknown) {
    await rollbackSecurityVisitorParkingSlot(apartmentId, slotId)

    if (isDuplicateKeyError(error)) {
      if (duplicateKeyPatternIncludes(error, "visitorVisitId")) {
        throw new AppError(
          "Selected visitor already has an active parking assignment",
          409
        )
      }

      throw new AppError(
        "Parking slot already has an active assignment",
        409
      )
    }
    throw error
  }
}

export const releaseParkingSlotService = async ({
  apartmentId,
  userId,
  slotId,
}: {
  apartmentId: string
  userId: string
  slotId: string
}) => {
  assertParkingSlotId(slotId)

  const slotExists = await findSecurityVisitorParkingSlot({
    apartmentId,
    slotId,
  })
  if (!slotExists) throw new AppError("Parking slot not found", 404)

  const assignment = await VisitorParkingAssignmentModel.findOneAndUpdate(
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
    },
    { new: true }
  )

  if (!assignment) {
    throw new AppError("No active parking assignment found", 404)
  }

  const released = await releaseSecurityVisitorParkingSlot(
    apartmentId,
    slotId
  )
  if (!released) throw new AppError("Parking slot not found", 404)

  const slot = await findSecurityVisitorParkingSlot({
    apartmentId,
    slotId,
  })

  if (!slot) throw new AppError("Parking slot not found", 404)
  return (await enrichSlots(apartmentId, [slot]))[0]
}
