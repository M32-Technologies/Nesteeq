import { Types } from "mongoose"

import {
  ParkingSlotStatus,
  ParkingUsageType,
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IParkingSlot,
  type LeanParkingSlot,
  type ParkingSummary,
  type ParkingVehicleType,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "../modules/parking/parking.interface.js"
import {
  ParkingSlotModel,
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "../modules/parking/parking.model.js"
import { AppError } from "./AppError.js"
import { escapeRegExp } from "./regex.js"
import { toId } from "./parking.js"

type LeanManagerParkingSlot = Pick<
  IParkingSlot,
  "slotNumber" | "vehicleType" | "status" | "createdAt" | "updatedAt"
> & {
  _id: Types.ObjectId
  apartmentId: Types.ObjectId
}

type SecurityParkingListInput = {
  apartmentId: string
  status?: "ALL" | VisitorParkingSlotStatusType
  vehicleType?: ParkingVehicleType
  search?: string
  page?: number
  limit?: number
}

const toObjectId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}`, 400)
  }

  return new Types.ObjectId(value)
}

const mapManagerStatus = (
  status: IParkingSlot["status"]
): VisitorParkingSlotStatusType => {
  if (status === ParkingSlotStatus.AVAILABLE) {
    return VisitorParkingSlotStatus.AVAILABLE
  }

  if (status === ParkingSlotStatus.INACTIVE) {
    return VisitorParkingSlotStatus.UNAVAILABLE
  }

  return VisitorParkingSlotStatus.OCCUPIED
}

const mapSecurityStatus = (
  status: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">
) => {
  if (status === VisitorParkingSlotStatus.AVAILABLE) {
    return ParkingSlotStatus.AVAILABLE
  }

  if (status === VisitorParkingSlotStatus.UNAVAILABLE) {
    return ParkingSlotStatus.INACTIVE
  }

  throw new AppError(
    "Reserved status is only supported for security-created slots",
    400
  )
}

const managerStatusFilter = (status?: "ALL" | VisitorParkingSlotStatusType) => {
  if (!status || status === "ALL") return undefined
  if (status === VisitorParkingSlotStatus.AVAILABLE) return ParkingSlotStatus.AVAILABLE
  if (status === VisitorParkingSlotStatus.UNAVAILABLE) return ParkingSlotStatus.INACTIVE
  if (status === VisitorParkingSlotStatus.OCCUPIED) {
    return { $in: [ParkingSlotStatus.OCCUPIED, ParkingSlotStatus.ASSIGNED] }
  }

  return "__NO_MANAGER_STATUS__"
}

const toSecuritySlot = (slot: LeanManagerParkingSlot): LeanParkingSlot => ({
  _id: slot._id,
  apartmentId: slot.apartmentId,
  slotNumber: slot.slotNumber,
  vehicleType: slot.vehicleType,
  status: mapManagerStatus(slot.status),
  notes: null,
  createdAt: slot.createdAt,
  updatedAt: slot.updatedAt,
})

const addSummaryCount = (
  summary: ParkingSummary,
  status: VisitorParkingSlotStatusType,
  count: number
) => {
  summary.totalVisitorSlots += count
  if (status === VisitorParkingSlotStatus.AVAILABLE) summary.available += count
  if (status === VisitorParkingSlotStatus.OCCUPIED) summary.occupied += count
  if (status === VisitorParkingSlotStatus.RESERVED) summary.reserved += count
  if (status === VisitorParkingSlotStatus.UNAVAILABLE) summary.unavailable += count
}

export const getSecurityVisitorParkingSummary = async (
  apartmentId: string
): Promise<ParkingSummary> => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const [legacyRows, managerRows] = await Promise.all([
    VisitorParkingSlotModel.aggregate<{ _id: VisitorParkingSlotStatusType; count: number }>([
      { $match: { apartmentId: apartmentObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ParkingSlotModel.aggregate<{ _id: IParkingSlot["status"]; count: number }>([
      { $match: { apartmentId: apartmentObjectId, usageType: ParkingUsageType.VISITOR } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ])
  const summary = {
    totalVisitorSlots: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    unavailable: 0,
  }

  legacyRows.forEach(({ _id, count }) => addSummaryCount(summary, _id, count))
  managerRows.forEach(({ _id, count }) =>
    addSummaryCount(summary, mapManagerStatus(_id), count)
  )

  return summary
}

export const listSecurityVisitorParkingSlots = async ({
  apartmentId,
  status = "ALL",
  vehicleType,
  search,
  page = 1,
  limit = 10,
}: SecurityParkingListInput) => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const trimmedSearch = search?.trim()
  const slotNumber = trimmedSearch
    ? new RegExp(escapeRegExp(trimmedSearch), "i")
    : undefined
  const activeSlotIds =
    status === VisitorParkingSlotStatus.AVAILABLE
      ? await VisitorParkingAssignmentModel.distinct("slotId", {
          apartmentId: apartmentObjectId,
          status: VisitorParkingAssignmentStatus.ACTIVE,
        })
      : []
  const legacyFilter: Record<string, unknown> = { apartmentId: apartmentObjectId }
  const managerFilter: Record<string, unknown> = {
    apartmentId: apartmentObjectId,
    usageType: ParkingUsageType.VISITOR,
  }
  const mappedManagerStatus = managerStatusFilter(status)

  if (status !== "ALL") legacyFilter.status = status
  if (vehicleType) {
    managerFilter.vehicleType = vehicleType
    legacyFilter.vehicleType =
      vehicleType === "OTHER" ? { $in: [null, "OTHER"] } : vehicleType
  }
  if (slotNumber) {
    legacyFilter.slotNumber = slotNumber
    managerFilter.slotNumber = slotNumber
  }
  if (activeSlotIds.length > 0) {
    legacyFilter._id = { $nin: activeSlotIds }
    managerFilter._id = { $nin: activeSlotIds }
  }
  if (mappedManagerStatus === "__NO_MANAGER_STATUS__") {
    managerFilter._id = { $exists: false }
  } else if (mappedManagerStatus) {
    managerFilter.status = mappedManagerStatus
  }

  const [legacySlots, managerSlots, summary] = await Promise.all([
    VisitorParkingSlotModel.find(legacyFilter).lean() as unknown as Promise<LeanParkingSlot[]>,
    ParkingSlotModel.find(managerFilter).lean<LeanManagerParkingSlot[]>(),
    getSecurityVisitorParkingSummary(apartmentId),
  ])
  const slots = [...legacySlots, ...managerSlots.map(toSecuritySlot)].sort(
    (a, b) => a.slotNumber.localeCompare(b.slotNumber)
  )
  const skip = (page - 1) * limit

  return {
    summary,
    slots: slots.slice(skip, skip + limit),
    totalCount: slots.length,
  }
}

export const findSecurityVisitorParkingSlot = async ({
  apartmentId,
  slotId,
}: {
  apartmentId: string
  slotId: string
}) => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const slotObjectId = toObjectId(slotId, "parking slot id")
  const legacySlot = (await VisitorParkingSlotModel.findOne({
    _id: slotObjectId,
    apartmentId: apartmentObjectId,
  }).lean()) as unknown as LeanParkingSlot | null

  if (legacySlot) return legacySlot

  const managerSlot = await ParkingSlotModel.findOne({
    _id: slotObjectId,
    apartmentId: apartmentObjectId,
    usageType: ParkingUsageType.VISITOR,
  }).lean<LeanManagerParkingSlot | null>()

  return managerSlot ? toSecuritySlot(managerSlot) : null
}

export const claimSecurityVisitorParkingSlot = async ({
  apartmentId,
  slotId,
  vehicleNumber,
}: {
  apartmentId: string
  slotId: string
  vehicleNumber: string
}) => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const slotObjectId = toObjectId(slotId, "parking slot id")
  const legacySlot = (await VisitorParkingSlotModel.findOneAndUpdate(
    {
      _id: slotObjectId,
      apartmentId: apartmentObjectId,
      status: VisitorParkingSlotStatus.AVAILABLE,
    },
    { $set: { status: VisitorParkingSlotStatus.OCCUPIED } },
    { new: true }
  ).lean()) as unknown as LeanParkingSlot | null

  if (legacySlot) return legacySlot

  const managerSlot = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: slotObjectId,
      apartmentId: apartmentObjectId,
      usageType: ParkingUsageType.VISITOR,
      status: ParkingSlotStatus.AVAILABLE,
    },
    {
      $set: {
        status: ParkingSlotStatus.OCCUPIED,
        vehicleNumber,
        assignedAt: new Date(),
      },
    },
    { new: true }
  ).lean<LeanManagerParkingSlot | null>()

  return managerSlot ? toSecuritySlot(managerSlot) : null
}

export const rollbackSecurityVisitorParkingSlot = async (
  apartmentId: string,
  slotId: string
) => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const slotObjectId = toObjectId(slotId, "parking slot id")

  await Promise.all([
    VisitorParkingSlotModel.updateOne(
      { _id: slotObjectId, apartmentId: apartmentObjectId },
      { $set: { status: VisitorParkingSlotStatus.AVAILABLE } }
    ),
    ParkingSlotModel.updateOne(
      { _id: slotObjectId, apartmentId: apartmentObjectId, usageType: ParkingUsageType.VISITOR },
      { $set: { status: ParkingSlotStatus.AVAILABLE, vehicleNumber: null, assignedAt: null } }
    ),
  ])
}

export const releaseSecurityVisitorParkingSlot = async (
  apartmentId: string,
  slotId: string
) => {
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const slotObjectId = toObjectId(slotId, "parking slot id")
  const [legacyResult, managerResult] = await Promise.all([
    VisitorParkingSlotModel.updateOne(
      { _id: slotObjectId, apartmentId: apartmentObjectId },
      { $set: { status: VisitorParkingSlotStatus.AVAILABLE } }
    ),
    ParkingSlotModel.updateOne(
      { _id: slotObjectId, apartmentId: apartmentObjectId, usageType: ParkingUsageType.VISITOR },
      { $set: { status: ParkingSlotStatus.AVAILABLE, vehicleNumber: null, assignedAt: null } }
    ),
  ])

  return legacyResult.matchedCount > 0 || managerResult.matchedCount > 0
}

export const setSecurityVisitorParkingSlotStatus = async ({
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
  const apartmentObjectId = toObjectId(apartmentId, "apartment context")
  const slotObjectId = toObjectId(slotId, "parking slot id")
  const legacySlot = (await VisitorParkingSlotModel.findOneAndUpdate(
    { _id: slotObjectId, apartmentId: apartmentObjectId },
    { $set: { status, notes: notes?.trim() || null } },
    { new: true }
  ).lean()) as unknown as LeanParkingSlot | null

  if (legacySlot) return legacySlot

  const managerSlot = await ParkingSlotModel.findOneAndUpdate(
    { _id: slotObjectId, apartmentId: apartmentObjectId, usageType: ParkingUsageType.VISITOR },
    {
      $set: {
        status: mapSecurityStatus(status),
        vehicleNumber: null,
        assignedAt: null,
        visitorId: null,
      },
    },
    { new: true }
  ).lean<LeanManagerParkingSlot | null>()

  return managerSlot ? toSecuritySlot(managerSlot) : null
}
