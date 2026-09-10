import { Types } from "mongoose"

import { getApartmentFlatsService } from "../security/security-directory.service.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IVisitorParkingAssignment,
  type IVisitorParkingSlot,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import { VisitorParkingAssignmentModel, VisitorParkingSlotModel } from "./parking.model.js"

export type ObjectIdLike = {
  toString: () => string
}

export type LeanParkingSlot = IVisitorParkingSlot & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
}

export type LeanParkingAssignment = IVisitorParkingAssignment & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  slotId: ObjectIdLike
  flatId: ObjectIdLike
  visitorVisitId?: ObjectIdLike | null
  guestPassId?: ObjectIdLike | null
}

export type LinkedVisitorVisit = {
  _id: ObjectIdLike
  flatId: ObjectIdLike
  visitorPassId?: ObjectIdLike | null
  visitorName: string
  vehicleNumber?: string | null
}

type ParkingSummary = {
  totalVisitorSlots: number
  available: number
  occupied: number
  reserved: number
  unavailable: number
}

type DuplicateKeyError = {
  code?: number
  keyPattern?: Record<string, unknown>
}

export const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

export const toMongoId = (value: string) =>
  Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value

export const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const isDuplicateKeyError = (
  error: unknown
): error is DuplicateKeyError =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000

export const duplicateKeyPatternIncludes = (
  error: unknown,
  key: string
) => {
  if (
    !isDuplicateKeyError(error) ||
    !error.keyPattern ||
    typeof error.keyPattern !== "object"
  ) {
    return false
  }

  return key in error.keyPattern
}

const getFlatNumberById = async (apartmentId: string) => {
  const { flats } = await getApartmentFlatsService(apartmentId)

  return new Map(flats.map((flat) => [flat._id, flat.flatNumber]))
}

export const getParkingSummary = async (
  apartmentId: string
): Promise<ParkingSummary> => {
  const rows = await VisitorParkingSlotModel.aggregate<{
    _id: VisitorParkingSlotStatusType
    count: number
  }>([
    { $match: { apartmentId: toMongoId(apartmentId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])

  const summary: ParkingSummary = {
    totalVisitorSlots: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    unavailable: 0,
  }

  for (const row of rows) {
    summary.totalVisitorSlots += row.count

    if (row._id === VisitorParkingSlotStatus.AVAILABLE) {
      summary.available = row.count
    }

    if (row._id === VisitorParkingSlotStatus.OCCUPIED) {
      summary.occupied = row.count
    }

    if (row._id === VisitorParkingSlotStatus.RESERVED) {
      summary.reserved = row.count
    }

    if (row._id === VisitorParkingSlotStatus.UNAVAILABLE) {
      summary.unavailable = row.count
    }
  }

  return summary
}

export const enrichSlots = async (
  apartmentId: string,
  slots: LeanParkingSlot[]
) => {
  if (slots.length === 0) return []

  const slotIds = slots.map((slot) => toId(slot._id))
  const assignments = await VisitorParkingAssignmentModel.find({
    apartmentId,
    slotId: { $in: slotIds },
    status: VisitorParkingAssignmentStatus.ACTIVE,
  })
    .sort({ assignedAt: -1 })
    .lean()

  const assignmentRecords = assignments as unknown as LeanParkingAssignment[]
  const assignmentBySlotId = new Map(
    assignmentRecords.map((assignment) => [toId(assignment.slotId), assignment])
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
            flatNumber: flatNumberById.get(toId(assignment.flatId)) ?? null,
            visitorVisitId: toId(assignment.visitorVisitId) || null,
            guestPassId: toId(assignment.guestPassId) || null,
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
