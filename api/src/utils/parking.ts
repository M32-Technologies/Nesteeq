import { Types } from "mongoose"

import { getApartmentFlatsService } from "./security/directory.js"
import {
  VisitorVisitModel,
  VisitorVisitStatus,
} from "../modules/visitors/visit.model.js"
import {
  ParkingVehicleType,
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type LeanParkingAssignment,
  type LeanParkingSlot,
  type LinkedVisitorVisit,
  type ObjectIdLike,
  type ParkingSummary,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "../modules/parking/parking.interface.js"
import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "../modules/parking/parking.model.js"
import { AppError } from "./AppError.js"
import { escapeRegExp } from "./regex.js"

type DuplicateKeyError = {
  code?: number
  keyPattern?: Record<string, unknown>
}

export const toId = (
  value: ObjectIdLike | string | null | undefined
) => value?.toString() ?? ""

const toMongoId = (value: string) =>
  Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value

export const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const normalizeVehicleNumber = (value: string) =>
  value.replace(/[\s-]/g, "").toUpperCase()

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
) =>
  isDuplicateKeyError(error) &&
  Boolean(error.keyPattern) &&
  typeof error.keyPattern === "object" &&
  key in error.keyPattern

export const assertParkingSlotId = (slotId: string) => {
  if (!Types.ObjectId.isValid(slotId)) {
    throw new AppError("Invalid parking slot ID", 400)
  }
}

export const parkingObjectId = (
  value: string | undefined,
  label: string
) => {
  if (!value || !Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}`, 400)
  }

  return new Types.ObjectId(value)
}

const parkingVehicleCodeMap: Record<ParkingVehicleType, string> = {
  CAR: "C",
  BIKE: "B",
  EV: "E",
  OTHER: "O",
}

export const generateParkingCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")

export const generateParkingZoneCode = (zoneName?: string | null) =>
  zoneName?.trim() ? generateParkingCode(zoneName) : null

export const buildParkingPrefix = ({
  level,
  zoneName,
  vehicleType,
}: {
  level: string
  zoneName?: string | null
  vehicleType: ParkingVehicleType
}) =>
  [
    generateParkingCode(level),
    generateParkingZoneCode(zoneName),
    parkingVehicleCodeMap[vehicleType] ?? "O",
  ]
    .filter(Boolean)
    .join("-")

const ensureVisitorParkingSlotAvailable = (
  status: VisitorParkingSlotStatusType
) => {
  if (status !== VisitorParkingSlotStatus.AVAILABLE) {
    throw new AppError("Parking slot is not available.", 400)
  }
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

  rows.forEach(({ _id, count }) => {
    summary.totalVisitorSlots += count
    if (_id === VisitorParkingSlotStatus.AVAILABLE) summary.available = count
    if (_id === VisitorParkingSlotStatus.OCCUPIED) summary.occupied = count
    if (_id === VisitorParkingSlotStatus.RESERVED) summary.reserved = count
    if (_id === VisitorParkingSlotStatus.UNAVAILABLE) summary.unavailable = count
  })

  return summary
}

export const enrichSlots = async (
  apartmentId: string,
  slots: LeanParkingSlot[]
) => {
  if (slots.length === 0) return []

  const assignments = (await VisitorParkingAssignmentModel.find({
    apartmentId,
    slotId: { $in: slots.map((slot) => toId(slot._id)) },
    status: VisitorParkingAssignmentStatus.ACTIVE,
  })
    .sort({ assignedAt: -1 })
    .lean()) as unknown as LeanParkingAssignment[]
  const assignmentBySlotId = new Map(
    assignments.map((assignment) => [toId(assignment.slotId), assignment])
  )
  const flatNumberById = await getFlatNumberById(apartmentId)

  return slots.map((slot) => {
    const assignment = assignmentBySlotId.get(toId(slot._id))
    return {
      _id: toId(slot._id),
      apartmentId: toId(slot.apartmentId),
      slotNumber: slot.slotNumber,
      vehicleType: slot.vehicleType ?? null,
      status: slot.status,
      notes: slot.notes ?? null,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      currentAssignment: assignment
        ? {
            _id: toId(assignment._id),
            flatId: toId(assignment.flatId),
            flatNumber:
              flatNumberById.get(toId(assignment.flatId)) ?? null,
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

export const getLinkedVisitorVisit = async ({
  apartmentId,
  flatId,
  visitorVisitId,
}: {
  apartmentId: string
  flatId: string
  visitorVisitId?: string
}) => {
  if (!visitorVisitId) return null
  if (!Types.ObjectId.isValid(visitorVisitId)) {
    throw new AppError("Invalid visitor visit ID", 400)
  }

  const linkedVisitorVisit = (await VisitorVisitModel.findOne({
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

  return linkedVisitorVisit
}

export const rollbackClaimedSlot = async (
  apartmentId: string,
  slotId: string
) => {
  await VisitorParkingSlotModel.updateOne(
    {
      _id: slotId,
      apartmentId,
      status: VisitorParkingSlotStatus.OCCUPIED,
    },
    { $set: { status: VisitorParkingSlotStatus.AVAILABLE } }
  )
}

const getVehicleNumberLookupRegex = (vehicleNumber: string) =>
  new RegExp(
    `^${vehicleNumber
      .split("")
      .map((character) => escapeRegExp(character))
      .join("[\\s-]*")}$`,
    "i"
  )

export const ensureParkingSlotCanBeAssigned = async ({
  apartmentId,
  slotId,
  slotStatus,
  visitorVisitId,
  vehicleNumber,
}: {
  apartmentId: string
  slotId: string
  slotStatus: VisitorParkingSlotStatusType
  visitorVisitId?: Types.ObjectId | null
  vehicleNumber: string
}) => {
  const activeSlotAssignment =
    await VisitorParkingAssignmentModel.exists({
      apartmentId,
      slotId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
    })

  if (activeSlotAssignment) {
    throw new AppError(
      "Parking slot already has an active assignment",
      409
    )
  }

  const activeVehicleAssignment =
    await VisitorParkingAssignmentModel.exists({
      apartmentId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
      vehicleNumber: getVehicleNumberLookupRegex(vehicleNumber),
    })

  if (activeVehicleAssignment) {
    throw new AppError(
      "This vehicle already has an active parking assignment",
      409
    )
  }

  ensureVisitorParkingSlotAvailable(slotStatus)
  if (!visitorVisitId) return

  const activeVisitorAssignment =
    await VisitorParkingAssignmentModel.exists({
      apartmentId,
      visitorVisitId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
    })

  if (activeVisitorAssignment) {
    throw new AppError(
      "Selected visitor already has an active parking assignment",
      409
    )
  }
}
