import mongoose, { Types } from "mongoose"

import { Apartment } from "../apartment/apartment.model.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import { ensureFlatInApartment, ensureResidentInApartment, getApartmentFlatsService } from "../security/security.service.js"
import { VisitorVisitModel, VisitorVisitStatus } from "../visitors/visit.model.js"
import {
  ParkingSlotStatus, ParkingUsageType, ParkingVehicleType, VisitorParkingAssignmentStatus, VisitorParkingSlotStatus,
  type DuplicateKeyError, type GeneratedParkingSlotResponse, type IParkingSlot, type LeanManagerParkingSlot,
  type LeanParkingAssignment, type LeanParkingSlot, type LinkedVisitorVisit, type ObjectIdLike,
  type ParkingSlotStatus as ParkingSlotStatusType, type ParkingSummary, type SecurityParkingListInput,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import { ParkingSlotModel, VisitorParkingAssignmentModel, VisitorParkingSlotModel } from "./parking.model.js"
import type { AssignResidentParkingInput, GenerateParkingSlotsInput, GetParkingSlotsQuery, ManagerGenerateParkingSlotsInput, UpdateParkingSlotInput } from "./parking.schema.js"

// --- Helper Functions ---

export const toId = (val: ObjectIdLike | string | null | undefined) => val?.toString() ?? ""
export const toMongoId = (val: string) => (Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : val)
export const normalizeText = (val?: string | null) => val?.trim() || null
export const normalizeVehicleNumber = (val: string) => val.replace(/[\s-]/g, "").toUpperCase()
export const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000
export const duplicateKeyPatternIncludes = (err: unknown, key: string) =>
  isDuplicateKeyError(err) && Boolean(err.keyPattern && typeof err.keyPattern === "object" && key in err.keyPattern)
export const assertParkingSlotId = (slotId: string) => {
  if (!Types.ObjectId.isValid(slotId)) throw new AppError("Invalid parking slot ID", 400)
}
export const parkingObjectId = (val: string | undefined, label: string) => {
  if (!val || !Types.ObjectId.isValid(val)) throw new AppError(`Invalid ${label}`, 400)
  return new Types.ObjectId(val)
}
const toObjectId = (val: string, label: string) => parkingObjectId(val, label)
const parkingVehicleCodeMap: Record<ParkingVehicleType, string> = { CAR: "C", BIKE: "B", EV: "E", OTHER: "O" }

export const generateParkingCode = (val: string) => val.trim().toUpperCase().split(/\s+/).filter(Boolean).map((w) => w[0]).join("")
export const generateParkingZoneCode = (zoneName?: string | null) => zoneName?.trim() ? generateParkingCode(zoneName) : null
export const buildParkingPrefix = ({ level, zoneName, vehicleType }: { level: string; zoneName?: string | null; vehicleType: ParkingVehicleType }) =>
  [generateParkingCode(level), generateParkingZoneCode(zoneName), parkingVehicleCodeMap[vehicleType] ?? "O"].filter(Boolean).join("-")
export const ensureVisitorParkingSlotAvailable = (status: VisitorParkingSlotStatusType) => {
  if (status !== VisitorParkingSlotStatus.AVAILABLE) throw new AppError("Parking slot is not available.", 400)
}

const getFlatNumberById = async (apartmentId: string) => {
  const { flats } = await getApartmentFlatsService(apartmentId)
  return new Map(flats.map((f) => [f._id, f.flatNumber]))
}

const accumulateSummary = (s: ParkingSummary, status: VisitorParkingSlotStatusType, count: number) => {
  s.totalVisitorSlots += count
  if (status === VisitorParkingSlotStatus.AVAILABLE) s.available += count
  else if (status === VisitorParkingSlotStatus.OCCUPIED) s.occupied += count
  else if (status === VisitorParkingSlotStatus.RESERVED) s.reserved += count
  else if (status === VisitorParkingSlotStatus.UNAVAILABLE) s.unavailable += count
}

export const getParkingSummary = async (apartmentId: string): Promise<ParkingSummary> => {
  const rows = await VisitorParkingSlotModel.aggregate<{ _id: VisitorParkingSlotStatusType; count: number }>([
    { $match: { apartmentId: toMongoId(apartmentId) } }, { $group: { _id: "$status", count: { $sum: 1 } } },
  ])
  const summary: ParkingSummary = { totalVisitorSlots: 0, available: 0, occupied: 0, reserved: 0, unavailable: 0 }
  for (const { _id, count } of rows) accumulateSummary(summary, _id, count)
  return summary
}

export const enrichSlots = async (apartmentId: string, slots: LeanParkingSlot[]) => {
  if (!slots.length) return []
  const [assignments, flatNumberById] = await Promise.all([
    VisitorParkingAssignmentModel.find({ apartmentId, slotId: { $in: slots.map((s) => toId(s._id)) }, status: VisitorParkingAssignmentStatus.ACTIVE }).sort({ assignedAt: -1 }).lean<LeanParkingAssignment[]>(),
    getFlatNumberById(apartmentId),
  ])
  const bySlot = new Map(assignments.map((a) => [toId(a.slotId), a]))
  return slots.map((s) => {
    const a = bySlot.get(toId(s._id))
    return {
      _id: toId(s._id), apartmentId: toId(s.apartmentId), slotNumber: s.slotNumber, vehicleType: s.vehicleType ?? null,
      status: s.status, notes: s.notes ?? null, createdAt: s.createdAt, updatedAt: s.updatedAt,
      currentAssignment: a ? {
        _id: toId(a._id), flatId: toId(a.flatId), flatNumber: flatNumberById.get(toId(a.flatId)) ?? null,
        visitorVisitId: toId(a.visitorVisitId) || null, guestPassId: toId(a.guestPassId) || null,
        visitorName: a.visitorName, vehicleNumber: a.vehicleNumber, vehicleType: a.vehicleType ?? null,
        notes: a.notes ?? null, assignedBy: a.assignedBy, assignedAt: a.assignedAt,
      } : null,
    }
  })
}

export const getLinkedVisitorVisit = async ({ apartmentId, flatId, visitorVisitId }: { apartmentId: string; flatId: string; visitorVisitId?: string }) => {
  if (!visitorVisitId) return null
  if (!Types.ObjectId.isValid(visitorVisitId)) throw new AppError("Invalid visitor visit ID", 400)
  const visit = await VisitorVisitModel.findOne({ _id: visitorVisitId, apartmentId, status: VisitorVisitStatus.ACTIVE }).select("_id flatId visitorPassId visitorName vehicleNumber").lean<LinkedVisitorVisit | null>()
  if (!visit) throw new AppError("Selected visitor is not currently checked in", 400)
  if (toId(visit.flatId) !== flatId) throw new AppError("Selected visitor does not match the selected flat", 400)
  return visit
}

export const rollbackClaimedSlot = (apartmentId: string, slotId: string) =>
  VisitorParkingSlotModel.updateOne({ _id: slotId, apartmentId, status: VisitorParkingSlotStatus.OCCUPIED }, { $set: { status: VisitorParkingSlotStatus.AVAILABLE } })

const getVehicleLookupRegex = (val: string) =>
  new RegExp(`^${val.split("").map((c) => escapeRegExp(c)).join("[\\s-]*")}$`, "i")

export const ensureParkingSlotCanBeAssigned = async ({
  apartmentId, slotId, slotStatus, visitorVisitId, vehicleNumber,
}: { apartmentId: string; slotId: string; slotStatus: VisitorParkingSlotStatusType; visitorVisitId?: Types.ObjectId | null; vehicleNumber: string }) => {
  const [hasSlot, hasVehicle] = await Promise.all([
    VisitorParkingAssignmentModel.exists({ apartmentId, slotId, status: VisitorParkingAssignmentStatus.ACTIVE }),
    VisitorParkingAssignmentModel.exists({ apartmentId, status: VisitorParkingAssignmentStatus.ACTIVE, vehicleNumber: getVehicleLookupRegex(vehicleNumber) }),
  ])
  if (hasSlot) throw new AppError("Parking slot already has an active assignment", 409)
  if (hasVehicle) throw new AppError("This vehicle already has an active parking assignment", 409)
  ensureVisitorParkingSlotAvailable(slotStatus)
  if (visitorVisitId) {
    const hasVisitor = await VisitorParkingAssignmentModel.exists({ apartmentId, visitorVisitId, status: VisitorParkingAssignmentStatus.ACTIVE })
    if (hasVisitor) throw new AppError("Selected visitor already has an active parking assignment", 409)
  }
}

// --- Security & Manager Status Mappers ---

const mapManagerStatus = (s: IParkingSlot["status"]): VisitorParkingSlotStatusType =>
  s === ParkingSlotStatus.AVAILABLE ? VisitorParkingSlotStatus.AVAILABLE : s === ParkingSlotStatus.INACTIVE ? VisitorParkingSlotStatus.UNAVAILABLE : VisitorParkingSlotStatus.OCCUPIED

const mapSecurityStatus = (s: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">) => {
  if (s === VisitorParkingSlotStatus.AVAILABLE) return ParkingSlotStatus.AVAILABLE
  if (s === VisitorParkingSlotStatus.UNAVAILABLE) return ParkingSlotStatus.INACTIVE
  throw new AppError("Reserved status is only supported for security-created slots", 400)
}

const managerStatusFilter = (s?: "ALL" | VisitorParkingSlotStatusType) => {
  if (!s || s === "ALL") return undefined
  if (s === VisitorParkingSlotStatus.AVAILABLE) return ParkingSlotStatus.AVAILABLE
  if (s === VisitorParkingSlotStatus.UNAVAILABLE) return ParkingSlotStatus.INACTIVE
  return s === VisitorParkingSlotStatus.OCCUPIED ? { $in: [ParkingSlotStatus.OCCUPIED, ParkingSlotStatus.ASSIGNED] } : "__NO_MANAGER_STATUS__"
}

const toSecuritySlot = (slot: LeanManagerParkingSlot): LeanParkingSlot => ({
  _id: slot._id, apartmentId: slot.apartmentId, slotNumber: slot.slotNumber,
  vehicleType: slot.vehicleType, status: mapManagerStatus(slot.status),
  notes: null, createdAt: slot.createdAt, updatedAt: slot.updatedAt,
})

export const getSecurityVisitorParkingSummary = async (apartmentId: string): Promise<ParkingSummary> => {
  const aptId = toObjectId(apartmentId, "apartment context")
  const [legacy, manager] = await Promise.all([
    VisitorParkingSlotModel.aggregate<{ _id: VisitorParkingSlotStatusType; count: number }>([{ $match: { apartmentId: aptId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ParkingSlotModel.aggregate<{ _id: IParkingSlot["status"]; count: number }>([{ $match: { apartmentId: aptId, usageType: ParkingUsageType.VISITOR } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ])
  const summary: ParkingSummary = { totalVisitorSlots: 0, available: 0, occupied: 0, reserved: 0, unavailable: 0 }
  for (const { _id, count } of legacy) accumulateSummary(summary, _id, count)
  for (const { _id, count } of manager) accumulateSummary(summary, mapManagerStatus(_id), count)
  return summary
}

export const listSecurityVisitorParkingSlots = async ({
  apartmentId, status = "ALL", vehicleType, search, page = 1, limit = 10,
}: SecurityParkingListInput) => {
  const aptObjectId = toObjectId(apartmentId, "apartment context")
  const slotNumber = search?.trim() ? new RegExp(escapeRegExp(search.trim()), "i") : undefined
  const activeSlotIds = status === VisitorParkingSlotStatus.AVAILABLE
    ? await VisitorParkingAssignmentModel.distinct("slotId", { apartmentId: aptObjectId, status: VisitorParkingAssignmentStatus.ACTIVE }) : []
  const legacyFilter: Record<string, unknown> = { apartmentId: aptObjectId }
  const managerFilter: Record<string, unknown> = { apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR }
  const mappedStatus = managerStatusFilter(status)

  if (status !== "ALL") legacyFilter.status = status
  if (vehicleType) {
    managerFilter.vehicleType = vehicleType
    legacyFilter.vehicleType = vehicleType === "OTHER" ? { $in: [null, "OTHER"] } : vehicleType
  }
  if (slotNumber) { legacyFilter.slotNumber = slotNumber; managerFilter.slotNumber = slotNumber }
  if (activeSlotIds.length) { legacyFilter._id = { $nin: activeSlotIds }; managerFilter._id = { $nin: activeSlotIds } }
  if (mappedStatus === "__NO_MANAGER_STATUS__") managerFilter._id = { $exists: false }
  else if (mappedStatus) managerFilter.status = mappedStatus

  const [legacySlots, managerSlots, summary] = await Promise.all([
    VisitorParkingSlotModel.find(legacyFilter).lean<LeanParkingSlot[]>(),
    ParkingSlotModel.find(managerFilter).lean<LeanManagerParkingSlot[]>(),
    getSecurityVisitorParkingSummary(apartmentId),
  ])
  const slots = [...legacySlots, ...managerSlots.map(toSecuritySlot)].sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
  const skip = (page - 1) * limit
  return { summary, slots: slots.slice(skip, skip + limit), totalCount: slots.length }
}

export const findSecurityVisitorParkingSlot = async ({ apartmentId, slotId }: { apartmentId: string; slotId: string }) => {
  const aptObjectId = toObjectId(apartmentId, "apartment context"), sObjectId = toObjectId(slotId, "parking slot id")
  const legacy = await VisitorParkingSlotModel.findOne({ _id: sObjectId, apartmentId: aptObjectId }).lean<LeanParkingSlot | null>()
  if (legacy) return legacy
  const manager = await ParkingSlotModel.findOne({ _id: sObjectId, apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR }).lean<LeanManagerParkingSlot | null>()
  return manager ? toSecuritySlot(manager) : null
}

export const claimSecurityVisitorParkingSlot = async ({ apartmentId, slotId, vehicleNumber }: { apartmentId: string; slotId: string; vehicleNumber: string }) => {
  const aptObjectId = toObjectId(apartmentId, "apartment context"), sObjectId = toObjectId(slotId, "parking slot id")
  const legacy = await VisitorParkingSlotModel.findOneAndUpdate(
    { _id: sObjectId, apartmentId: aptObjectId, status: VisitorParkingSlotStatus.AVAILABLE },
    { $set: { status: VisitorParkingSlotStatus.OCCUPIED } }, { new: true }
  ).lean<LeanParkingSlot | null>()
  if (legacy) return legacy
  const manager = await ParkingSlotModel.findOneAndUpdate(
    { _id: sObjectId, apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR, status: ParkingSlotStatus.AVAILABLE },
    { $set: { status: ParkingSlotStatus.OCCUPIED, vehicleNumber, assignedAt: new Date() } }, { new: true }
  ).lean<LeanManagerParkingSlot | null>()
  return manager ? toSecuritySlot(manager) : null
}

const resetSecurityVisitorSlot = (apartmentId: string, slotId: string) => {
  const aptId = toObjectId(apartmentId, "apartment context"), sId = toObjectId(slotId, "parking slot id")
  return Promise.all([
    VisitorParkingSlotModel.updateOne({ _id: sId, apartmentId: aptId }, { $set: { status: VisitorParkingSlotStatus.AVAILABLE } }),
    ParkingSlotModel.updateOne({ _id: sId, apartmentId: aptId, usageType: ParkingUsageType.VISITOR }, { $set: { status: ParkingSlotStatus.AVAILABLE, vehicleNumber: null, assignedAt: null } }),
  ])
}

export const rollbackSecurityVisitorParkingSlot = async (apartmentId: string, slotId: string) => {
  await resetSecurityVisitorSlot(apartmentId, slotId)
}

export const releaseSecurityVisitorParkingSlot = async (apartmentId: string, slotId: string) => {
  const [leg, mgr] = await resetSecurityVisitorSlot(apartmentId, slotId)
  return leg.matchedCount > 0 || mgr.matchedCount > 0
}

export const setSecurityVisitorParkingSlotStatus = async ({
  apartmentId, slotId, status, notes,
}: { apartmentId: string; slotId: string; status: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">; notes?: string }) => {
  const aptId = toObjectId(apartmentId, "apartment context"), sId = toObjectId(slotId, "parking slot id")
  const leg = await VisitorParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: aptId }, { $set: { status, notes: notes?.trim() || null } }, { new: true }
  ).lean<LeanParkingSlot | null>()
  if (leg) return leg
  const mgr = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: aptId, usageType: ParkingUsageType.VISITOR },
    { $set: { status: mapSecurityStatus(status), vehicleNumber: null, assignedAt: null, visitorId: null } }, { new: true }
  ).lean<LeanManagerParkingSlot | null>()
  return mgr ? toSecuritySlot(mgr) : null
}

// --- Property Manager Parking Services ---

const getParkingIds = (parkingId: string, apartmentId?: string) => ({
  apartmentObjectId: parkingObjectId(apartmentId, "apartment id"),
  parkingObjectId: parkingObjectId(parkingId, "parking id"),
})

const managerStatusSet = new Set<string>(Object.values(ParkingSlotStatus))

export const generateParkingSlots = async (apartmentId: string, data: ManagerGenerateParkingSlotsInput): Promise<GeneratedParkingSlotResponse> => {
  const aptObjectId = parkingObjectId(apartmentId, "apartment id")
  const session = await mongoose.startSession()
  try {
    let result: GeneratedParkingSlotResponse | undefined
    await session.withTransaction(async () => {
      const apartment = await Apartment.findById(aptObjectId).select("parkingSlots").session(session).lean()
      if (!apartment) throw new AppError("Apartment not found", 404)
      const currentCount = await ParkingSlotModel.countDocuments({ apartmentId: aptObjectId }).session(session)
      const max = Number(apartment.parkingSlots || 0)
      const rem = max - currentCount
      if (max && data.numberOfSlots > rem) throw new AppError(`Only ${rem} parking slots can be generated. ${currentCount} of ${max} parking slots already exist.`, 400)
      const level = data.level.trim(), zoneName = normalizeText(data.zoneName), zoneCode = generateParkingZoneCode(zoneName)
      const prefix = buildParkingPrefix({ level, zoneName, vehicleType: data.vehicleType })
      const existing = await ParkingSlotModel.find({ apartmentId: aptObjectId, prefix }).select("slotNumber").session(session).lean()
      const nextNo = existing.reduce((m, s) => Math.max(m, Number(s.slotNumber.match(/(\d+)$/)?.[1] || 0)), 0) + 1
      const slots = Array.from({ length: data.numberOfSlots }, (_, i) => ({
        apartmentId: aptObjectId, level, zoneName, zoneCode, prefix, slotNumber: `${prefix}-${String(nextNo + i).padStart(3, "0")}`,
        vehicleType: data.vehicleType, usageType: data.usageType, status: ParkingSlotStatus.AVAILABLE,
        flatId: null, residentId: null, visitorId: null, vehicleNumber: null, assignedAt: null,
      }))
      const inserted = await ParkingSlotModel.insertMany(slots, { session, ordered: true })
      result = {
        totalSlotsGenerated: inserted.length, level, zoneName, zoneCode, prefix,
        generatedSlots: inserted.map((s) => ({ id: s._id.toString(), slotNumber: s.slotNumber, level: s.level, zoneName: s.zoneName ?? null, zoneCode: s.zoneCode ?? null, prefix: s.prefix, vehicleType: s.vehicleType, usageType: s.usageType, status: s.status })),
      }
    })
    if (!result) throw new AppError("Failed to generate parking slots", 500)
    return result
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError("One or more parking slots already exist. Please try again.", 409)
    throw err
  } finally {
    await session.endSession()
  }
}

export const getParkingSlots = async (query: GetParkingSlotsQuery, apartmentId: string) => {
  const aptObjectId = parkingObjectId(apartmentId, "apartment id")
  const filter: Record<string, unknown> = { apartmentId: aptObjectId }
  if (query.vehicleType) filter.vehicleType = query.vehicleType
  if (query.usageType) filter.usageType = query.usageType
  if (query.status && query.status !== "ALL" && managerStatusSet.has(query.status)) filter.status = query.status
  if (query.level) filter.level = query.level
  if (query.zoneCode) filter.zoneCode = query.zoneCode
  if (query.search) {
    const reg = new RegExp(escapeRegExp(query.search.trim()), "i")
    filter.$or = [{ slotNumber: reg }, { vehicleNumber: reg }]
  }
  const page = query.page ?? 1, limit = query.limit ?? 10, skip = (page - 1) * limit
  const sortDir: 1 | -1 = query.sortOrder === "desc" ? -1 : 1
  const sortOpts: Record<string, 1 | -1> = query.sortBy === "createdAt" ? { createdAt: sortDir, slotNumber: 1 } : { slotNumber: sortDir, createdAt: -1 }

  const [parkingSlots, total] = await Promise.all([
    ParkingSlotModel.find(filter).populate("flatId", "_id flatNumber").populate("residentId", "_id userId phoneNumber residentType")
      .collation({ locale: "en", numericOrdering: true }).sort(sortOpts).skip(skip).limit(limit).lean(),
    ParkingSlotModel.countDocuments(filter),
  ])
  return { parkingSlots, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getParkingSlotById = async (parkingId: string, apartmentId: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
    .populate("flatId", "_id flatNumber").populate("residentId", "_id userId phoneNumber residentType").lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  return slot
}

export const updateParkingSlot = async (parkingId: string, data: UpdateParkingSlotInput, apartmentId?: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.status === "ASSIGNED" || slot.status === "OCCUPIED") throw new AppError("Parking slot must be released before changing parking configuration", 400)
  const updateData: Record<string, unknown> = {}
  if (data.level !== undefined) updateData.level = data.level.trim()
  if (data.zoneName !== undefined) updateData.zoneName = normalizeText(data.zoneName)
  if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
  if (data.usageType !== undefined) updateData.usageType = data.usageType
  if (!Object.keys(updateData).length) throw new AppError("No parking slot fields provided for update", 400)
  const updated = await ParkingSlotModel.findOneAndUpdate({ _id: sId, apartmentId: apartmentObjectId }, { $set: updateData }, { returnDocument: "after", runValidators: true }).lean()
  if (!updated) throw new AppError("Parking slot not found", 404)
  return updated
}

export const assignResidentParking = async (parkingId: string, data: AssignResidentParkingInput, apartmentId?: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  await ensureFlatInApartment({ apartmentId: apartmentId!, flatId: data.flatId })
  if (data.residentId) await ensureResidentInApartment({ apartmentId: apartmentId!, residentId: data.residentId, flatId: data.flatId })
  const updated = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: apartmentObjectId, usageType: ParkingUsageType.RESIDENT, status: ParkingSlotStatus.AVAILABLE },
    { $set: { status: ParkingSlotStatus.ASSIGNED, flatId: new Types.ObjectId(data.flatId), residentId: data.residentId ? new Types.ObjectId(data.residentId) : null, vehicleNumber: normalizeVehicleNumber(data.vehicleNumber), assignedAt: new Date() } },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (updated) return updated
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT) throw new AppError("Visitor parking cannot be assigned as resident parking", 400)
  throw new AppError("Parking slot is not available", 409)
}

export const releaseResidentParking = async (parkingId: string, apartmentId?: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const released = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: apartmentObjectId, usageType: ParkingUsageType.RESIDENT, status: ParkingSlotStatus.ASSIGNED },
    { $set: { status: ParkingSlotStatus.AVAILABLE, flatId: null, residentId: null, visitorId: null, vehicleNumber: null, assignedAt: null } },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (released) return released
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT) throw new AppError("Visitor parking cannot be released using the resident parking release API", 400)
  if (slot.status === ParkingSlotStatus.AVAILABLE) throw new AppError("Parking slot is already available", 409)
  throw new AppError("Only assigned parking slots can be released", 400)
}

export const updateParkingSlotStatus = async (parkingId: string, status: Extract<ParkingSlotStatusType, "AVAILABLE" | "INACTIVE">, apartmentId?: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (status === ParkingSlotStatus.INACTIVE && slot.status !== ParkingSlotStatus.AVAILABLE) throw new AppError("Only available parking slots can be deactivated", 409)
  if (status === ParkingSlotStatus.AVAILABLE && slot.status !== ParkingSlotStatus.INACTIVE) throw new AppError("Only inactive parking slots can be activated", 400)
  const updated = await ParkingSlotModel.findOneAndUpdate({ _id: sId, apartmentId: apartmentObjectId, status: slot.status }, { $set: { status } }, { returnDocument: "after", runValidators: true }).lean()
  if (!updated) throw new AppError("Parking slot status has already changed", 409)
  return updated
}

export const getParkingStats = async (apartmentId: string) => {
  const base = { apartmentId: parkingObjectId(apartmentId, "apartment id") }
  const count = (extra: Record<string, unknown> = {}) => ParkingSlotModel.countDocuments({ ...base, ...extra })
  const [total, available, assigned, occupied, inactive, residentSlots, visitorSlots] = await Promise.all([
    count(), count({ status: ParkingSlotStatus.AVAILABLE }), count({ status: ParkingSlotStatus.ASSIGNED }),
    count({ status: ParkingSlotStatus.OCCUPIED }), count({ status: ParkingSlotStatus.INACTIVE }),
    count({ usageType: ParkingUsageType.RESIDENT }), count({ usageType: ParkingUsageType.VISITOR }),
  ])
  return { total, available, assigned, occupied, inactive, residentSlots, visitorSlots }
}

// --- Security Visitor Parking Public Services ---

export const createParkingSlotService = async ({ apartmentId, slotNumber, notes }: { apartmentId: string; slotNumber: string; notes?: string }) => {
  try {
    const slot = await VisitorParkingSlotModel.create({ apartmentId, slotNumber: slotNumber.toUpperCase(), status: VisitorParkingSlotStatus.AVAILABLE, notes: normalizeText(notes) })
    return (await enrichSlots(apartmentId, [slot.toObject() as LeanParkingSlot]))[0]
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError("Parking slot already exists for this apartment", 409)
    throw err
  }
}

export const listParkingSlotsService = async ({
  apartmentId, status = "ALL", vehicleType, search, page = 1, limit = 10,
}: { apartmentId: string; status?: "ALL" | VisitorParkingSlotStatusType; vehicleType?: ParkingVehicleType; search?: string; page?: number; limit?: number }) => {
  const { slots, totalCount, summary } = await listSecurityVisitorParkingSlots({ apartmentId, status, vehicleType, search, page, limit })
  return { summary, slots: await enrichSlots(apartmentId, slots), pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } }
}

export const updateParkingSlotStatusService = async ({
  apartmentId, userId, slotId, status, notes,
}: { apartmentId: string; userId: string; slotId: string; status: Exclude<VisitorParkingSlotStatusType, "OCCUPIED">; notes?: string }) => {
  assertParkingSlotId(slotId)
  const slot = await setSecurityVisitorParkingSlotStatus({ apartmentId, slotId, status, notes })
  if (!slot) throw new AppError("Parking slot not found", 404)
  await VisitorParkingAssignmentModel.updateMany({ apartmentId, slotId, status: VisitorParkingAssignmentStatus.ACTIVE }, { $set: { status: VisitorParkingAssignmentStatus.RELEASED, releasedBy: userId, releasedAt: new Date() } })
  return (await enrichSlots(apartmentId, [slot]))[0]
}

export const generateParkingSlotsService = async ({ prefix, totalSlots, startNumber = 1 }: GenerateParkingSlotsInput, apartmentId: string) => {
  const aptObjectId = parkingObjectId(apartmentId, "apartment id"), normPrefix = prefix.trim().toUpperCase(), endNumber = startNumber + totalSlots - 1
  const slotNumbers = Array.from({ length: totalSlots }, (_, i) => `${normPrefix}-${String(startNumber + i).padStart(3, "0")}`)
  try {
    const duplicate = await VisitorParkingSlotModel.findOne({ apartmentId: aptObjectId, slotNumber: { $in: slotNumbers } }).select("_id slotNumber").lean<{ _id: Types.ObjectId; slotNumber: string }>()
    if (duplicate) throw new AppError(`Generated parking slot already exists: ${duplicate.slotNumber}`, 409)
    const inserted = await VisitorParkingSlotModel.insertMany(slotNumbers.map((sn) => ({ apartmentId: aptObjectId, slotNumber: sn, status: VisitorParkingSlotStatus.AVAILABLE, notes: null })), { ordered: true })
    return {
      prefix: normPrefix, startNumber, endNumber, totalSlotsGenerated: inserted.length,
      generatedSlots: inserted.map((s) => ({ id: s._id.toString(), slotNumber: s.slotNumber, status: s.status, notes: s.notes ?? null })),
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    if (isDuplicateKeyError(err)) throw new AppError("One or more generated parking slots already exist", 409)
    throw new AppError("Parking slot generation failed", 500)
  }
}

export const updateParkingSlotService = async ({ apartmentId, slotId, slotNumber, notes }: { apartmentId: string; slotId: string; slotNumber?: string; notes?: string } & UpdateParkingSlotInput) => {
  assertParkingSlotId(slotId)
  const slot = await VisitorParkingSlotModel.findOne({ _id: slotId, apartmentId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slotNumber !== undefined) {
    const norm = slotNumber.trim().toUpperCase()
    if (await VisitorParkingSlotModel.exists({ _id: { $ne: slot._id }, apartmentId, slotNumber: norm })) throw new AppError("Parking slot number already exists for this apartment", 409)
    slot.slotNumber = norm
  }
  if (notes !== undefined) slot.notes = normalizeText(notes)
  await slot.save()
  return (await enrichSlots(apartmentId, [slot.toObject() as LeanParkingSlot]))[0]
}

export const assignParkingSlotService = async ({
  apartmentId, userId, slotId, flatId, visitorVisitId, visitorName, vehicleNumber, vehicleType, notes,
}: { apartmentId: string; userId: string; slotId: string; flatId: string; visitorVisitId?: string; visitorName: string; vehicleNumber: string; vehicleType: ParkingVehicleType; notes?: string }) => {
  assertParkingSlotId(slotId)
  await ensureFlatInApartment({ apartmentId, flatId })
  const linked = await getLinkedVisitorVisit({ apartmentId, flatId, visitorVisitId })
  const visitObjectId = linked ? new Types.ObjectId(toId(linked._id)) : null
  const guestPassObjectId = linked?.visitorPassId ? new Types.ObjectId(toId(linked.visitorPassId)) : null
  const normVehicle = normalizeVehicleNumber(vehicleNumber)
  const slot = await findSecurityVisitorParkingSlot({ apartmentId, slotId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if ((slot.vehicleType ?? "OTHER") !== vehicleType) throw new AppError("Selected parking slot does not match vehicle type", 400)
  await ensureParkingSlotCanBeAssigned({ apartmentId, slotId, slotStatus: slot.status, visitorVisitId: visitObjectId, vehicleNumber: normVehicle })
  const claimed = await claimSecurityVisitorParkingSlot({ apartmentId, slotId, vehicleNumber: normVehicle })
  if (!claimed) throw new AppError("Parking slot is no longer available", 409)
  try {
    const assignment = await VisitorParkingAssignmentModel.create({
      apartmentId, slotId, flatId, visitorVisitId: visitObjectId, guestPassId: guestPassObjectId,
      visitorName: linked?.visitorName ?? visitorName, vehicleNumber: normVehicle, vehicleType,
      notes: normalizeText(notes), status: VisitorParkingAssignmentStatus.ACTIVE, assignedBy: userId, assignedAt: new Date(),
    })
    return assignment.toObject() as LeanParkingAssignment
  } catch (err) {
    await rollbackSecurityVisitorParkingSlot(apartmentId, slotId)
    if (isDuplicateKeyError(err)) {
      if (duplicateKeyPatternIncludes(err, "visitorVisitId")) throw new AppError("Selected visitor already has an active parking assignment", 409)
      throw new AppError("Parking slot already has an active assignment", 409)
    }
    throw err
  }
}

export const releaseParkingSlotService = async ({ apartmentId, userId, slotId }: { apartmentId: string; userId: string; slotId: string }) => {
  assertParkingSlotId(slotId)
  if (!await findSecurityVisitorParkingSlot({ apartmentId, slotId })) throw new AppError("Parking slot not found", 404)
  const assignment = await VisitorParkingAssignmentModel.findOneAndUpdate(
    { apartmentId, slotId, status: VisitorParkingAssignmentStatus.ACTIVE },
    { $set: { status: VisitorParkingAssignmentStatus.RELEASED, releasedBy: userId, releasedAt: new Date() } }, { new: true }
  )
  if (!assignment) throw new AppError("No active parking assignment found", 404)
  await releaseSecurityVisitorParkingSlot(apartmentId, slotId)
  const slot = await findSecurityVisitorParkingSlot({ apartmentId, slotId })
  return (await enrichSlots(apartmentId, slot ? [slot] : []))[0]
}
