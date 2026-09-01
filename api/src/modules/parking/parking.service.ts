import mongoose, {
  Types,
} from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import {
  ensureFlatInApartment,
  getApartmentFlatsService,
} from "../security/security-directory.service.js"
import { VisitorVisitStatus } from "../visitors/visit/visit.interface.js"
import { VisitorVisitModel } from "../visitors/visit/visit.model.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IVisitorParkingAssignment,
  type IVisitorParkingSlot,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "./parking.model.js"
import { ensureVisitorParkingSlotAvailable } from "./parking-availability.js"

type ObjectIdLike = {
  toString: () => string
}

type LeanParkingSlot = IVisitorParkingSlot & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
}

type LeanParkingAssignment = IVisitorParkingAssignment & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  slotId: ObjectIdLike
  flatId: ObjectIdLike
  visitorVisitId?: ObjectIdLike | null
  guestPassId?: ObjectIdLike | null
}

type LinkedVisitorVisit = {
  _id: ObjectIdLike
  flatId: ObjectIdLike
  visitorPassId?: ObjectIdLike | null
  visitorName: string
  vehicleNumber?: string | null
}

const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

const normalizeText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const getFlatNumberById = async (apartmentId: string) => {
  const { flats } = await getApartmentFlatsService(apartmentId)

  return new Map(
    flats.map((flat) => [flat._id, flat.flatNumber])
  )
}

const getParkingSummary = (slots: LeanParkingSlot[]) => ({
  totalVisitorSlots: slots.length,
  available: slots.filter(
    (slot) =>
      slot.status === VisitorParkingSlotStatus.AVAILABLE
  ).length,
  occupied: slots.filter(
    (slot) =>
      slot.status === VisitorParkingSlotStatus.OCCUPIED
  ).length,
  reserved: slots.filter(
    (slot) =>
      slot.status === VisitorParkingSlotStatus.RESERVED
  ).length,
  outOfService: slots.filter(
    (slot) =>
      slot.status ===
      VisitorParkingSlotStatus.OUT_OF_SERVICE
  ).length,
})

const enrichSlots = async (
  apartmentId: string,
  slots: LeanParkingSlot[]
) => {
  const slotIds = slots.map((slot) => toId(slot._id))
  const assignments =
    await VisitorParkingAssignmentModel.find({
      apartmentId,
      slotId: {
        $in: slotIds,
      },
      status: VisitorParkingAssignmentStatus.ACTIVE,
    })
      .sort({ assignedAt: -1 })
      .lean()

  const assignmentRecords =
    assignments as unknown as LeanParkingAssignment[]
  const assignmentBySlotId = new Map(
    assignmentRecords.map((assignment) => [
      toId(assignment.slotId),
      assignment,
    ])
  )
  const flatNumberById = await getFlatNumberById(apartmentId)

  return slots.map((slot) => {
    const assignment = assignmentBySlotId.get(toId(slot._id))

    return {
      _id: toId(slot._id),
      apartmentId: toId(slot.apartmentId),
      slotNumber: slot.slotNumber,
      status: slot.status,
      notes: slot.notes ?? null,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      currentAssignment: assignment
        ? {
            _id: toId(assignment._id),
            flatId: toId(assignment.flatId),
            flatNumber:
              flatNumberById.get(toId(assignment.flatId)) ??
              null,
            visitorVisitId:
              toId(assignment.visitorVisitId) || null,
            guestPassId:
              toId(assignment.guestPassId) || null,
            visitorName: assignment.visitorName,
            vehicleNumber: assignment.vehicleNumber,
            vehicleType: assignment.vehicleType ?? null,
            notes: assignment.notes ?? null,
            assignedBy: assignment.assignedBy,
            assignedAt: assignment.assignedAt,
          }
        : null,
    }
  })
}

export const createParkingSlotService = async ({
  apartmentId,
  slotNumber,
  status = VisitorParkingSlotStatus.AVAILABLE,
  notes,
}: {
  apartmentId: string
  slotNumber: string
  status?: Exclude<
    VisitorParkingSlotStatusType,
    "OCCUPIED"
  >
  notes?: string
}) => {
  try {
    const slot = await VisitorParkingSlotModel.create({
      apartmentId,
      slotNumber: slotNumber.toUpperCase(),
      status,
      notes: normalizeText(notes),
    })

    const records = await enrichSlots(apartmentId, [
      slot.toObject() as LeanParkingSlot,
    ])

    return records[0]
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
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
}: {
  apartmentId: string
  status?: "ALL" | VisitorParkingSlotStatusType
  search?: string
}) => {
  const filter: Record<string, unknown> = {
    apartmentId,
  }

  if (status !== "ALL") {
    filter.status = status
  }

  const trimmedSearch = search?.trim()

  if (trimmedSearch) {
    filter.slotNumber = new RegExp(
      escapeRegExp(trimmedSearch),
      "i"
    )
  }

  const slots = (await VisitorParkingSlotModel.find(filter)
    .sort({ slotNumber: 1 })
    .lean()) as unknown as LeanParkingSlot[]

  const allSlots = (await VisitorParkingSlotModel.find({
    apartmentId,
  }).lean()) as unknown as LeanParkingSlot[]

  return {
    summary: getParkingSummary(allSlots),
    slots: await enrichSlots(apartmentId, slots),
  }
}

export const updateParkingSlotStatusService = async ({
  apartmentId,
  slotId,
  status,
  notes,
}: {
  apartmentId: string
  slotId: string
  status: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">
  notes?: string
}) => {
  const slot = await VisitorParkingSlotModel.findOne({
    _id: slotId,
    apartmentId,
  })

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  const activeAssignment =
    await VisitorParkingAssignmentModel.findOne({
      apartmentId,
      slotId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
    }).lean()

  if (activeAssignment) {
    throw new AppError(
      "Occupied parking slot cannot be manually changed",
      400
    )
  }

  slot.status = status
  slot.notes = normalizeText(notes)

  await slot.save()

  const records = await enrichSlots(apartmentId, [
    slot.toObject() as LeanParkingSlot,
  ])

  return records[0]
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
  vehicleType?: string
  notes?: string
}) => {
  if (!Types.ObjectId.isValid(slotId)) {
    throw new AppError("Invalid parking slot ID", 400)
  }

  await ensureFlatInApartment({
    apartmentId,
    flatId,
  })

  let linkedVisitorVisit: LinkedVisitorVisit | null = null

  if (visitorVisitId) {
    if (!Types.ObjectId.isValid(visitorVisitId)) {
      throw new AppError("Invalid visitor visit ID", 400)
    }

    linkedVisitorVisit = (await VisitorVisitModel.findOne({
      _id: visitorVisitId,
      apartmentId,
      status: VisitorVisitStatus.ACTIVE,
    })
      .select("_id flatId visitorPassId visitorName vehicleNumber")
      .lean()) as LinkedVisitorVisit | null

    if (!linkedVisitorVisit) {
      throw new AppError(
        "Selected visitor is not currently checked in",
        400
      )
    }

    if (toId(linkedVisitorVisit.flatId) !== flatId) {
      throw new AppError(
        "Selected visitor does not match the selected flat",
        400
      )
    }
  }

  const visitorVisitObjectId = linkedVisitorVisit
    ? new Types.ObjectId(toId(linkedVisitorVisit._id))
    : null
  const guestPassObjectId = linkedVisitorVisit?.visitorPassId
    ? new Types.ObjectId(toId(linkedVisitorVisit.visitorPassId))
    : null

  const session = await mongoose.startSession()

  try {
    let createdAssignment:
      | LeanParkingAssignment
      | null = null

    await session.withTransaction(async () => {
      const slot = await VisitorParkingSlotModel.findOne({
        _id: slotId,
        apartmentId,
      }).session(session)

      if (!slot) {
        throw new AppError("Parking slot not found", 404)
      }

      ensureVisitorParkingSlotAvailable(slot.status)

      const assignment =
        await VisitorParkingAssignmentModel.create(
          [
            {
              apartmentId,
              slotId,
              flatId,
              visitorVisitId: visitorVisitObjectId,
              guestPassId: guestPassObjectId,
              visitorName:
                linkedVisitorVisit?.visitorName ?? visitorName,
              vehicleNumber: (
                linkedVisitorVisit?.vehicleNumber ??
                vehicleNumber
              ).toUpperCase(),
              vehicleType: normalizeText(vehicleType),
              notes: normalizeText(notes),
              status:
                VisitorParkingAssignmentStatus.ACTIVE,
              assignedBy: userId,
              assignedAt: new Date(),
            },
          ],
          { session }
        )

      slot.status =
        VisitorParkingSlotStatus.OCCUPIED
      await slot.save({ session })

      createdAssignment =
        assignment[0].toObject() as LeanParkingAssignment
    })

    return createdAssignment
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "Parking slot already has an active assignment",
        409
      )
    }

    throw error
  } finally {
    await session.endSession()
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
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const slot = await VisitorParkingSlotModel.findOne({
        _id: slotId,
        apartmentId,
      }).session(session)

      if (!slot) {
        throw new AppError("Parking slot not found", 404)
      }

      const assignment =
        await VisitorParkingAssignmentModel.findOne({
          apartmentId,
          slotId,
          status: VisitorParkingAssignmentStatus.ACTIVE,
        }).session(session)

      if (!assignment) {
        throw new AppError(
          "No active parking assignment found",
          404
        )
      }

      assignment.status =
        VisitorParkingAssignmentStatus.RELEASED
      assignment.releasedBy = userId
      assignment.releasedAt = new Date()
      await assignment.save({ session })

      slot.status =
        VisitorParkingSlotStatus.AVAILABLE
      await slot.save({ session })
    })
  } finally {
    await session.endSession()
  }

  const slot = await VisitorParkingSlotModel.findOne({
    _id: slotId,
    apartmentId,
  }).lean()

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  const records = await enrichSlots(apartmentId, [
    slot as unknown as LeanParkingSlot,
  ])

  return records[0]
}
