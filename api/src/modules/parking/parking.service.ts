import mongoose, { Types } from "mongoose"

import { Apartment } from "../apartment/apartment.model.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import { ensureFlatInApartment, ensureResidentInApartment, getApartmentFlatsService } from "../security/security.service.js"
import { VisitorVisitModel, VisitorVisitStatus } from "../visitors/visit.model.js"
import {
  ParkingSlotStatus,
  ParkingUsageType,
  ParkingVehicleType,
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type DuplicateKeyError,
  type GeneratedParkingSlotResponse,
  type IParkingSlot,
  type LeanParkingAssignment,
  type LeanParkingSlot,
  type LinkedVisitorVisit,
  type ObjectIdLike,
  type ParkingSlotStatus as ParkingSlotStatusType,
  type ParkingSummary,
  type SecurityParkingListInput,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"
import { ParkingSlotModel } from "./parking.model.js"
import type {
  AssignResidentParkingInput,
  GenerateParkingSlotsInput,
  GetParkingSlotsQuery,
  ManagerGenerateParkingSlotsInput,
  UpdateParkingSlotInput,
} from "./parking.schema.js"

// --- Helpers ---

export const toId = (val: ObjectIdLike | string | null | undefined) => val?.toString() ?? ""
export const toMongoId = (val: string) => (Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : val)
export const normalizeText = (val?: string | null) => val?.trim() || null
export const normalizeVehicleNumber = (val: string) => val.replace(/[\s-]/g, "").toUpperCase()
export const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000

export const assertParkingSlotId = (slotId: string) => {
  if (!Types.ObjectId.isValid(slotId)) throw new AppError("Invalid parking slot ID", 400)
}
export const parkingObjectId = (val: string | undefined, label: string) => {
  if (!val || !Types.ObjectId.isValid(val)) throw new AppError(`Invalid ${label}`, 400)
  return new Types.ObjectId(val)
}
const toObjectId = (val: string, label: string) => parkingObjectId(val, label)

const parkingVehicleCodeMap: Record<ParkingVehicleType, string> = { CAR: "C", BIKE: "B", EV: "E", OTHER: "O" }
export const generateParkingCode = (val: string) =>
  val.trim().toUpperCase().split(/\s+/).filter(Boolean).map((w) => w[0]).join("")
export const generateParkingZoneCode = (zoneName?: string | null) =>
  zoneName?.trim() ? generateParkingCode(zoneName) : null
export const buildParkingPrefix = ({ level, zoneName, vehicleType }: { level: string; zoneName?: string | null; vehicleType: ParkingVehicleType }) =>
  [generateParkingCode(level), generateParkingZoneCode(zoneName), parkingVehicleCodeMap[vehicleType] ?? "O"].filter(Boolean).join("-")

const getFlatNumberById = async (apartmentId: string) => {
  const { flats } = await getApartmentFlatsService(apartmentId)
  return new Map(flats.map((f) => [f._id, f.flatNumber]))
}

// Convert a single unified ParkingSlot document to the frontend-compatible visitor slot shape
const formatVisitorSlot = (
  slot: IParkingSlot & { _id: Types.ObjectId },
  flatNumberMap?: Map<string, string>
): LeanParkingSlot => {
  const isOccupied = slot.status === ParkingSlotStatus.OCCUPIED
  const fId = slot.flatId ? toId(slot.flatId) : null
  const hasOccupant = isOccupied && (Boolean(slot.vehicleNumber) || Boolean(slot.visitorName))

  let status: Exclude<VisitorParkingSlotStatusType, "ALL"> = VisitorParkingSlotStatus.AVAILABLE
  if (slot.status === ParkingSlotStatus.INACTIVE) status = VisitorParkingSlotStatus.UNAVAILABLE
  else if (isOccupied || slot.status === ParkingSlotStatus.ASSIGNED) status = VisitorParkingSlotStatus.OCCUPIED

  return {
    _id: toId(slot._id),
    apartmentId: toId(slot.apartmentId),
    slotNumber: slot.slotNumber,
    vehicleType: slot.vehicleType,
    status,
    notes: slot.notes ?? null,
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
    currentAssignment: hasOccupant
      ? {
          _id: toId(slot._id),
          apartmentId: toId(slot.apartmentId),
          slotId: toId(slot._id),
          flatId: fId,
          flatNumber: (fId && flatNumberMap ? flatNumberMap.get(fId) : null) ?? null,
          visitorVisitId: slot.visitorVisitId ? toId(slot.visitorVisitId) : null,
          guestPassId: null,
          visitorName: slot.visitorName || "",
          vehicleNumber: slot.vehicleNumber || "",
          vehicleType: slot.vehicleType ?? null,
          notes: slot.notes ?? null,
          status: VisitorParkingAssignmentStatus.ACTIVE,
          assignedBy: slot.assignedBy || "",
          assignedAt: slot.assignedAt || slot.updatedAt || new Date(),
        }
      : null,
  }
}

// --- Visitor Parking Summary ---

export const getParkingSummary = async (apartmentId: string): Promise<ParkingSummary> => {
  const aptId = toObjectId(apartmentId, "apartment context")
  const rows = await ParkingSlotModel.aggregate<{ _id: IParkingSlot["status"]; count: number }>([
    { $match: { apartmentId: aptId, usageType: ParkingUsageType.VISITOR } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])
  const summary: ParkingSummary = { totalVisitorSlots: 0, available: 0, occupied: 0, reserved: 0, unavailable: 0 }
  for (const { _id, count } of rows) {
    summary.totalVisitorSlots += count
    if (_id === ParkingSlotStatus.AVAILABLE) summary.available += count
    else if (_id === ParkingSlotStatus.OCCUPIED || _id === ParkingSlotStatus.ASSIGNED) summary.occupied += count
    else if (_id === ParkingSlotStatus.INACTIVE) summary.unavailable += count
  }
  return summary
}

export const getSecurityVisitorParkingSummary = getParkingSummary

// --- Security Visitor Parking Public Services ---

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
  const aptObjectId = toObjectId(apartmentId, "apartment context")
  const filter: Record<string, unknown> = {
    apartmentId: aptObjectId,
    usageType: ParkingUsageType.VISITOR,
  }

  if (status === "AVAILABLE") {
    filter.status = ParkingSlotStatus.AVAILABLE
    filter.vehicleNumber = { $in: [null, ""] }
    filter.visitorVisitId = null
  } else if (status === "OCCUPIED") {
    filter.status = { $in: [ParkingSlotStatus.OCCUPIED, ParkingSlotStatus.ASSIGNED] }
  } else if (status === "UNAVAILABLE") {
    filter.status = ParkingSlotStatus.INACTIVE
  }

  if (vehicleType) {
    if (vehicleType === "OTHER") {
      filter.$or = [{ vehicleType: "OTHER" }, { vehicleType: null }, { vehicleType: { $exists: false } }]
    } else {
      filter.vehicleType = vehicleType
    }
  }
  if (search) {
    const reg = new RegExp(escapeRegExp(search.trim()), "i")
    const searchCondition = [{ slotNumber: reg }, { vehicleNumber: reg }, { visitorName: reg }]
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchCondition }]
      delete filter.$or
    } else {
      filter.$or = searchCondition
    }
  }

  const skip = (page - 1) * limit
  const [rawSlots, totalCount, summary, flatNumberMap] = await Promise.all([
    ParkingSlotModel.find(filter)
      .collation({ locale: "en", numericOrdering: true })
      .sort({ slotNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean<IParkingSlot[]>(),
    ParkingSlotModel.countDocuments(filter),
    getParkingSummary(apartmentId),
    getFlatNumberById(apartmentId),
  ])

  const slots = rawSlots.map((s) => formatVisitorSlot(s as IParkingSlot & { _id: Types.ObjectId }, flatNumberMap))
  return { summary, slots, pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } }
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
    const normSlot = slotNumber.trim().toUpperCase()
    const prefix = normSlot.split("-")[0] || "P"
    const slot = await ParkingSlotModel.create({
      apartmentId: toMongoId(apartmentId),
      slotNumber: normSlot,
      prefix,
      level: "Ground",
      vehicleType: ParkingVehicleType.CAR,
      usageType: ParkingUsageType.VISITOR,
      status: ParkingSlotStatus.AVAILABLE,
      notes: normalizeText(notes),
    })
    return formatVisitorSlot(slot.toObject())
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError("Parking slot already exists for this apartment", 409)
    throw err
  }
}

export const updateParkingSlotStatusService = async ({
  apartmentId,
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
  const aptId = toObjectId(apartmentId, "apartment context")
  const sId = toObjectId(slotId, "parking slot id")
  const newStatus = status === "AVAILABLE" ? ParkingSlotStatus.AVAILABLE : ParkingSlotStatus.INACTIVE

  const slot = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: aptId, usageType: ParkingUsageType.VISITOR },
    {
      $set: {
        status: newStatus,
        notes: normalizeText(notes),
        vehicleNumber: null,
        assignedAt: null,
        assignedBy: null,
        visitorId: null,
        visitorVisitId: null,
        visitorName: null,
        flatId: null,
      },
    },
    { new: true }
  ).lean<IParkingSlot | null>()

  if (!slot) throw new AppError("Parking slot not found", 404)
  return formatVisitorSlot(slot as IParkingSlot & { _id: Types.ObjectId })
}

export const generateParkingSlotsService = async (
  { prefix, totalSlots, startNumber = 1 }: GenerateParkingSlotsInput,
  apartmentId: string
) => {
  const aptObjectId = parkingObjectId(apartmentId, "apartment id")
  const normPrefix = prefix.trim().toUpperCase()
  const endNumber = startNumber + totalSlots - 1
  const slotNumbers = Array.from({ length: totalSlots }, (_, i) => `${normPrefix}-${String(startNumber + i).padStart(3, "0")}`)

  try {
    const duplicate = await ParkingSlotModel.findOne({ apartmentId: aptObjectId, slotNumber: { $in: slotNumbers } })
      .select("_id slotNumber")
      .lean<{ _id: Types.ObjectId; slotNumber: string }>()
    if (duplicate) throw new AppError(`Generated parking slot already exists: ${duplicate.slotNumber}`, 409)

    const inserted = await ParkingSlotModel.insertMany(
      slotNumbers.map((sn) => ({
        apartmentId: aptObjectId,
        level: "Ground",
        prefix: normPrefix,
        slotNumber: sn,
        vehicleType: ParkingVehicleType.CAR,
        usageType: ParkingUsageType.VISITOR,
        status: ParkingSlotStatus.AVAILABLE,
        notes: null,
      })),
      { ordered: true }
    )

    return {
      prefix: normPrefix,
      startNumber,
      endNumber,
      totalSlotsGenerated: inserted.length,
      generatedSlots: inserted.map((s) => ({
        id: s._id.toString(),
        slotNumber: s.slotNumber,
        status: s.status,
        notes: s.notes ?? null,
      })),
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    if (isDuplicateKeyError(err)) throw new AppError("One or more generated parking slots already exist", 409)
    throw new AppError("Parking slot generation failed", 500)
  }
}

export const updateParkingSlotService = async ({
  apartmentId,
  slotId,
  slotNumber,
  notes,
}: { apartmentId: string; slotId: string; slotNumber?: string; notes?: string } & UpdateParkingSlotInput) => {
  assertParkingSlotId(slotId)
  const slot = await ParkingSlotModel.findOne({ _id: slotId, apartmentId, usageType: ParkingUsageType.VISITOR })
  if (!slot) throw new AppError("Parking slot not found", 404)

  if (slotNumber !== undefined) {
    const norm = slotNumber.trim().toUpperCase()
    if (await ParkingSlotModel.exists({ _id: { $ne: slot._id }, apartmentId, slotNumber: norm })) {
      throw new AppError("Parking slot number already exists for this apartment", 409)
    }
    slot.slotNumber = norm
  }
  if (notes !== undefined) slot.notes = normalizeText(notes)
  await slot.save()
  return formatVisitorSlot(slot.toObject())
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

  const aptObjectId = toObjectId(apartmentId, "apartment context")
  const sObjectId = toObjectId(slotId, "parking slot id")
  const normVehicle = normalizeVehicleNumber(vehicleNumber)

  // Verify slot exists and matches vehicle type
  const slot = await ParkingSlotModel.findOne({ _id: sObjectId, apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.status !== ParkingSlotStatus.AVAILABLE) throw new AppError("Parking slot is not available.", 400)
  if ((slot.vehicleType ?? "OTHER") !== vehicleType) throw new AppError("Selected parking slot does not match vehicle type", 400)

  // Check if vehicle is already parked
  const vehicleRegex = new RegExp(`^${normVehicle.split("").map((c) => escapeRegExp(c)).join("[\\s-]*")}$`, "i")
  const vehicleExists = await ParkingSlotModel.exists({
    apartmentId: aptObjectId,
    usageType: ParkingUsageType.VISITOR,
    status: ParkingSlotStatus.OCCUPIED,
    vehicleNumber: vehicleRegex,
  })
  if (vehicleExists) throw new AppError("This vehicle already has an active parking assignment", 409)

  // Link VisitorVisit if provided
  let visitObjectId: Types.ObjectId | null = null
  let finalVisitorName = visitorName
  if (visitorVisitId) {
    if (!Types.ObjectId.isValid(visitorVisitId)) throw new AppError("Invalid visitor visit ID", 400)
    const visit = await VisitorVisitModel.findOne({ _id: visitorVisitId, apartmentId, status: VisitorVisitStatus.ACTIVE })
      .select("_id flatId visitorPassId visitorName vehicleNumber")
      .lean<LinkedVisitorVisit | null>()
    if (!visit) throw new AppError("Selected visitor is not currently checked in", 400)
    if (toId(visit.flatId) !== flatId) throw new AppError("Selected visitor does not match the selected flat", 400)
    visitObjectId = new Types.ObjectId(toId(visit._id))
    finalVisitorName = visit.visitorName || visitorName

    const visitorSlotExists = await ParkingSlotModel.exists({
      apartmentId: aptObjectId,
      usageType: ParkingUsageType.VISITOR,
      status: ParkingSlotStatus.OCCUPIED,
      visitorVisitId: visitObjectId,
    })
    if (visitorSlotExists) throw new AppError("Selected visitor already has an active parking assignment", 409)
  }

  const assignedAt = new Date()
  const updatedSlot = await ParkingSlotModel.findOneAndUpdate(
    { _id: sObjectId, apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR, status: ParkingSlotStatus.AVAILABLE },
    {
      $set: {
        status: ParkingSlotStatus.OCCUPIED,
        flatId: new Types.ObjectId(flatId),
        visitorVisitId: visitObjectId,
        visitorName: finalVisitorName,
        vehicleNumber: normVehicle,
        vehicleType,
        notes: normalizeText(notes),
        assignedBy: userId,
        assignedAt,
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean()

  if (!updatedSlot) throw new AppError("Parking slot is no longer available", 409)

  if (visitObjectId) {
    await VisitorVisitModel.updateOne({ _id: visitObjectId, apartmentId: aptObjectId }, { $set: { parkingSlotId: sObjectId } })
  }

  const flatNumberMap = await getFlatNumberById(apartmentId)
  return {
    _id: toId(updatedSlot._id),
    apartmentId: toId(updatedSlot.apartmentId),
    slotId: toId(updatedSlot._id),
    flatId: toId(updatedSlot.flatId),
    flatNumber: flatNumberMap.get(toId(updatedSlot.flatId)) ?? null,
    visitorVisitId: toId(updatedSlot.visitorVisitId) || null,
    guestPassId: null,
    visitorName: updatedSlot.visitorName || "",
    vehicleNumber: updatedSlot.vehicleNumber || "",
    vehicleType: updatedSlot.vehicleType,
    notes: updatedSlot.notes ?? null,
    status: VisitorParkingAssignmentStatus.ACTIVE,
    assignedBy: updatedSlot.assignedBy || userId,
    assignedAt: updatedSlot.assignedAt || assignedAt,
  } as LeanParkingAssignment
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
  const aptObjectId = toObjectId(apartmentId, "apartment context")
  const sObjectId = toObjectId(slotId, "parking slot id")

  const slot = await ParkingSlotModel.findOne({ _id: sObjectId, apartmentId: aptObjectId, usageType: ParkingUsageType.VISITOR })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.status !== ParkingSlotStatus.OCCUPIED) throw new AppError("No active parking assignment found", 404)

  const visitId = slot.visitorVisitId
  const releasedAt = new Date()

  await ParkingSlotModel.updateOne(
    { _id: sObjectId, apartmentId: aptObjectId },
    {
      $set: {
        status: ParkingSlotStatus.AVAILABLE,
        flatId: null,
        residentId: null,
        visitorId: null,
        visitorVisitId: null,
        visitorName: null,
        vehicleNumber: null,
        assignedBy: null,
        assignedAt: null,
        notes: null,
      },
    }
  )

  if (visitId) {
    await VisitorVisitModel.updateOne(
      { _id: visitId, apartmentId: aptObjectId },
      { $set: { parkingSlotId: null } }
    )
  }
  await VisitorVisitModel.updateMany(
    { apartmentId: aptObjectId, parkingSlotId: sObjectId },
    { $set: { parkingSlotId: null } }
  )

  return { slotId: toId(slot._id), releasedAt, releasedBy: userId }
}

// --- Property Manager Parking Services ---

const getParkingIds = (parkingId: string, apartmentId?: string) => ({
  apartmentObjectId: parkingObjectId(apartmentId, "apartment id"),
  parkingObjectId: parkingObjectId(parkingId, "parking id"),
})

const managerStatusSet = new Set<string>(Object.values(ParkingSlotStatus))

export const generateParkingSlots = async (
  apartmentId: string,
  data: ManagerGenerateParkingSlotsInput
): Promise<GeneratedParkingSlotResponse> => {
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
      if (max && data.numberOfSlots > rem)
        throw new AppError(`Only ${rem} parking slots can be generated. ${currentCount} of ${max} parking slots already exist.`, 400)
      const level = data.level.trim()
      const zoneName = normalizeText(data.zoneName)
      const zoneCode = generateParkingZoneCode(zoneName)
      const prefix = buildParkingPrefix({ level, zoneName, vehicleType: data.vehicleType })
      const existing = await ParkingSlotModel.find({ apartmentId: aptObjectId, prefix }).select("slotNumber").session(session).lean()
      const nextNo = existing.reduce((m, s) => Math.max(m, Number(s.slotNumber.match(/(\d+)$/)?.[1] || 0)), 0) + 1
      const slots = Array.from({ length: data.numberOfSlots }, (_, i) => ({
        apartmentId: aptObjectId,
        level,
        zoneName,
        zoneCode,
        prefix,
        slotNumber: `${prefix}-${String(nextNo + i).padStart(3, "0")}`,
        vehicleType: data.vehicleType,
        usageType: data.usageType,
        status: ParkingSlotStatus.AVAILABLE,
        flatId: null,
        residentId: null,
        visitorId: null,
        vehicleNumber: null,
        assignedAt: null,
      }))
      const inserted = await ParkingSlotModel.insertMany(slots, { session, ordered: true })
      result = {
        totalSlotsGenerated: inserted.length,
        level,
        zoneName,
        zoneCode,
        prefix,
        generatedSlots: inserted.map((s) => ({
          id: s._id.toString(),
          slotNumber: s.slotNumber,
          level: s.level,
          zoneName: s.zoneName ?? null,
          zoneCode: s.zoneCode ?? null,
          prefix: s.prefix,
          vehicleType: s.vehicleType,
          usageType: s.usageType,
          status: s.status,
        })),
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
  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const skip = (page - 1) * limit
  const sortDir: 1 | -1 = query.sortOrder === "desc" ? -1 : 1
  const sortOpts: Record<string, 1 | -1> =
    query.sortBy === "createdAt" ? { createdAt: sortDir, slotNumber: 1 } : { slotNumber: sortDir, createdAt: -1 }

  const [parkingSlots, total] = await Promise.all([
    ParkingSlotModel.find(filter)
      .populate("flatId", "_id flatNumber")
      .populate("residentId", "_id userId phoneNumber residentType")
      .collation({ locale: "en", numericOrdering: true })
      .sort(sortOpts)
      .skip(skip)
      .limit(limit)
      .lean(),
    ParkingSlotModel.countDocuments(filter),
  ])
  return { parkingSlots, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getParkingSlotById = async (parkingId: string, apartmentId: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
    .populate("flatId", "_id flatNumber")
    .populate("residentId", "_id userId phoneNumber residentType")
    .lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  return slot
}

export const updateParkingSlot = async (
  parkingId: string,
  data: UpdateParkingSlotInput,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.status === "ASSIGNED" || slot.status === "OCCUPIED")
    throw new AppError("Parking slot must be released before changing parking configuration", 400)
  const updateData: Record<string, unknown> = {}
  if (data.level !== undefined) updateData.level = data.level.trim()
  if (data.zoneName !== undefined) updateData.zoneName = normalizeText(data.zoneName)
  if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
  if (data.usageType !== undefined) updateData.usageType = data.usageType
  if (!Object.keys(updateData).length) throw new AppError("No parking slot fields provided for update", 400)
  const updated = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: apartmentObjectId },
    { $set: updateData },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (!updated) throw new AppError("Parking slot not found", 404)
  return updated
}

export const assignResidentParking = async (
  parkingId: string,
  data: AssignResidentParkingInput,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  await ensureFlatInApartment({ apartmentId: apartmentId!, flatId: data.flatId })
  if (data.residentId)
    await ensureResidentInApartment({
      apartmentId: apartmentId!,
      residentId: data.residentId,
      flatId: data.flatId,
    })
  const updated = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: sId,
      apartmentId: apartmentObjectId,
      usageType: ParkingUsageType.RESIDENT,
      status: ParkingSlotStatus.AVAILABLE,
    },
    {
      $set: {
        status: ParkingSlotStatus.ASSIGNED,
        flatId: new Types.ObjectId(data.flatId),
        residentId: data.residentId ? new Types.ObjectId(data.residentId) : null,
        vehicleNumber: data.vehicleNumber ? normalizeVehicleNumber(data.vehicleNumber) : null,
        assignedAt: new Date(),
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (updated) return updated
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT)
    throw new AppError("Visitor parking cannot be assigned as resident parking", 400)
  throw new AppError("Parking slot is not available", 409)
}

export const releaseResidentParking = async (parkingId: string, apartmentId?: string) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const released = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: sId,
      apartmentId: apartmentObjectId,
      usageType: ParkingUsageType.RESIDENT,
      status: ParkingSlotStatus.ASSIGNED,
    },
    {
      $set: {
        status: ParkingSlotStatus.AVAILABLE,
        flatId: null,
        residentId: null,
        visitorId: null,
        vehicleNumber: null,
        assignedAt: null,
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (released) return released
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT)
    throw new AppError("Visitor parking cannot be released using the resident parking release API", 400)
  if (slot.status === ParkingSlotStatus.AVAILABLE) throw new AppError("Parking slot is already available", 409)
  throw new AppError("Only assigned parking slots can be released", 400)
}

export const updateParkingSlotStatus = async (
  parkingId: string,
  status: Extract<ParkingSlotStatusType, "AVAILABLE" | "INACTIVE">,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId: sId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({ _id: sId, apartmentId: apartmentObjectId })
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (status === ParkingSlotStatus.INACTIVE && slot.status !== ParkingSlotStatus.AVAILABLE)
    throw new AppError("Only available parking slots can be deactivated", 409)
  if (status === ParkingSlotStatus.AVAILABLE && slot.status !== ParkingSlotStatus.INACTIVE)
    throw new AppError("Only inactive parking slots can be activated", 400)
  const updated = await ParkingSlotModel.findOneAndUpdate(
    { _id: sId, apartmentId: apartmentObjectId, status: slot.status },
    { $set: { status } },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (!updated) throw new AppError("Parking slot status has already changed", 409)
  return updated
}


export const getParkingStats = async (apartmentId: string) => {
  const aptObjectId = parkingObjectId(apartmentId, "apartment id")
  const [stats] = await ParkingSlotModel.aggregate([
    { $match: { apartmentId: aptObjectId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        available: {
          $sum: { $cond: [{ $eq: ["$status", ParkingSlotStatus.AVAILABLE] }, 1, 0] },
        },
        assigned: {
          $sum: { $cond: [{ $eq: ["$status", ParkingSlotStatus.ASSIGNED] }, 1, 0] },
        },
        occupied: {
          $sum: { $cond: [{ $eq: ["$status", ParkingSlotStatus.OCCUPIED] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ["$status", ParkingSlotStatus.INACTIVE] }, 1, 0] },
        },
        residentSlots: {
          $sum: { $cond: [{ $eq: ["$usageType", ParkingUsageType.RESIDENT] }, 1, 0] },
        },
        visitorSlots: {
          $sum: { $cond: [{ $eq: ["$usageType", ParkingUsageType.VISITOR] }, 1, 0] },
        },
      },
    },
  ])
  return {
    total: stats?.total ?? 0,
    available: stats?.available ?? 0,
    assigned: stats?.assigned ?? 0,
    occupied: stats?.occupied ?? 0,
    inactive: stats?.inactive ?? 0,
    residentSlots: stats?.residentSlots ?? 0,
    visitorSlots: stats?.visitorSlots ?? 0,
  }
}
