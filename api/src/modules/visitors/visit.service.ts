import crypto from "crypto"
import QRCode from "qrcode"
import { Types, type PipelineStage } from "mongoose"

import { Flat } from "../flat/flat.model.js"
import { normalizeVehicleNumber, assignParkingSlotService } from "../parking/parking.service.js"
import { ResidentModel } from "../resident/resident.model.js"
import { ParkingSlotStatus } from "../parking/parking.interface.js"
import { ParkingSlotModel } from "../parking/parking.model.js"
import {
  GuestPassModel,
  GuestPassStatus,
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
  type GuestPassStatus as GuestPassStatusType,
} from "./visit.model.js"
import type {
  CancelGuestPassInput,
  CheckInVisitorInput,
  CheckoutVisitorInput,
  CreateGuestPassInput,
  GuestPassByIdInput,
  ListGuestPassesInput,
  ListVisitorRecordsInput,
  ListVisitsInput,
  ManualVisitorEntryInput,
  ReleasedParkingAssignment,
  VisitorRecordsFacetResult,
  VisitorVisitListItem,
} from "./visit.types.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"

const toId = (val: unknown) => (val ? String(val) : "")
const getApartmentObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid apartment context", 400)
  return new Types.ObjectId(id)
}

// --- Token & Duplicate Helpers ---

export const hashGuestPassToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

export const parseGuestPassQrPayload = (payload: string) => {
  const trimmed = payload.trim()
  if (!trimmed) return ""
  try {
    const parsed = JSON.parse(trimmed) as { token?: string }
    if (parsed?.token && typeof parsed.token === "string") return parsed.token.trim()
  } catch {}
  try {
    const url = new URL(trimmed)
    const t = url.searchParams.get("token") ?? url.searchParams.get("guestPassToken") ?? url.searchParams.get("visitorToken") ?? url.searchParams.get("passToken")
    if (t) return t.trim()
  } catch {}
  const match = trimmed.match(/^(?:nesteeq:)?visitor-pass[:/](.+)$/i)
  return match?.[1]?.trim() ?? trimmed
}

export const manualVisitorDuplicateWindowMs = 5 * 60 * 1000

export const buildManualVisitorDuplicateFilter = ({
  apartmentId, flatId, visitorName, visitorPhone, vehicleNumber, now = new Date(),
}: {
  apartmentId: string; flatId: string; visitorName: string; visitorPhone?: string | null; vehicleNumber?: string | null; now?: Date
}) => {
  const phone = visitorPhone?.trim() || null
  const vehicle = vehicleNumber?.trim().toUpperCase() || null
  const createdAfter = new Date(now.getTime() - manualVisitorDuplicateWindowMs)
  const base: Record<string, unknown> = { apartmentId, flatId, entryType: VisitorEntryType.MANUAL }
  if (phone || vehicle) {
    return {
      ...base,
      $and: [
        { $or: [{ status: VisitorVisitStatus.ACTIVE }, { createdAt: { $gte: createdAfter } }] },
        { $or: [...(phone ? [{ visitorPhone: phone }] : []), ...(vehicle ? [{ vehicleNumber: vehicle }] : [])] },
      ],
    }
  }
  return { ...base, visitorName: new RegExp(`^${escapeRegExp(visitorName.trim())}$`, "i"), createdAt: { $gte: createdAfter } }
}

export const releaseActiveParkingForVisit = async ({
  apartmentId, userId, visitId, releasedAt,
}: {
  apartmentId: string; userId: string; visitId: string; releasedAt: Date
}): Promise<ReleasedParkingAssignment | null> => {
  const aptObjectId = new Types.ObjectId(apartmentId)
  const visitObjectId = new Types.ObjectId(visitId)

  const slot = await ParkingSlotModel.findOneAndUpdate(
    {
      apartmentId: aptObjectId,
      visitorVisitId: visitObjectId,
      status: ParkingSlotStatus.OCCUPIED,
    },
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
  ).lean()

  if (!slot) return null
  return { assignmentId: slot._id.toString(), slotId: slot._id.toString() }
}

// --- Guest Pass Services ---

const getActiveResidentByUserId = async (userId: string) => {
  const resident = await ResidentModel.findOne({ userId, status: "active" })
  if (!resident) throw new AppError("Active resident profile not found", 404)
  return resident
}

const expireOldGuestPasses = (apartmentId: unknown, residentId: unknown) =>
  GuestPassModel.updateMany(
    { apartmentId, createdByResidentId: residentId, status: GuestPassStatus.ACTIVE, validUntil: { $lt: new Date() } },
    { $set: { status: GuestPassStatus.EXPIRED } }
  )

export const createGuestPassService = async ({
  userId, flatId, visitorName, visitorPhone, purpose, vehicleNumber, vehicleType, validFrom, validUntil,
}: CreateGuestPassInput) => {
  const resident = await getActiveResidentByUserId(userId)
  if (resident.flatId.toString() !== flatId) throw new AppError("You are not authorized to create a guest pass for this flat", 403)
  const flat = await Flat.findOne({ _id: flatId, apartmentId: resident.apartmentId })
  if (!flat) throw new AppError("Flat not found in your apartment", 404)

  const now = new Date()
  if (validUntil <= validFrom) throw new AppError("Guest pass end time must be later than start time", 400)
  if (validUntil <= now) throw new AppError("Guest pass end time must be in the future", 400)

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashGuestPassToken(rawToken)
  const qrCodeDataUrl = await QRCode.toDataURL(rawToken, { width: 280, margin: 2, errorCorrectionLevel: "M" })

  const pass = await GuestPassModel.create({
    apartmentId: resident.apartmentId, createdByResidentId: resident._id, flatId: flat._id,
    visitorName, visitorPhone: visitorPhone?.trim() || null, purpose: purpose?.trim() || null,
    vehicleNumber: vehicleNumber ? normalizeVehicleNumber(vehicleNumber) : null,
    vehicleType: vehicleType ? vehicleType.toUpperCase() : null,
    rawToken, qrCodeDataUrl,
    tokenHash, validFrom, validUntil, status: GuestPassStatus.ACTIVE,
  })
  const { tokenHash: _, ...safePass } = pass.toObject()
  return { guestPass: { ...safePass, token: rawToken }, token: rawToken, qrCodeDataUrl }
}

export const getGuestPassesService = async ({ userId, page = 1, limit = 10, status }: ListGuestPassesInput) => {
  const resident = await getActiveResidentByUserId(userId)
  await expireOldGuestPasses(resident.apartmentId, resident._id)
  const filter: Record<string, unknown> = { apartmentId: resident.apartmentId, createdByResidentId: resident._id, ...(status ? { status } : {}) }
  const skip = (page - 1) * limit
  const [guestPasses, total] = await Promise.all([
    GuestPassModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GuestPassModel.countDocuments(filter),
  ])
  const totalPages = Math.ceil(total / limit)
  return { guestPasses, pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } }
}

export const getGuestPassByIdService = async ({ userId, guestPassId }: GuestPassByIdInput) => {
  const resident = await getActiveResidentByUserId(userId)
  await expireOldGuestPasses(resident.apartmentId, resident._id)
  const pass = await GuestPassModel.findOne({ _id: guestPassId, apartmentId: resident.apartmentId, createdByResidentId: resident._id }).lean()
  if (!pass) throw new AppError("Guest pass not found", 404)
  return pass
}

export const cancelGuestPassService = async ({ userId, guestPassId }: CancelGuestPassInput) => {
  const resident = await getActiveResidentByUserId(userId)
  await expireOldGuestPasses(resident.apartmentId, resident._id)
  const pass = await GuestPassModel.findOne({ _id: guestPassId, apartmentId: resident.apartmentId, createdByResidentId: resident._id })
  if (!pass) throw new AppError("Guest pass not found", 404)
  if (pass.status === GuestPassStatus.CANCELLED) throw new AppError("Guest pass is already cancelled", 400)
  if (pass.status === GuestPassStatus.EXPIRED) throw new AppError("Expired guest passes cannot be cancelled", 400)
  if (pass.status === GuestPassStatus.USED) throw new AppError("Used guest passes cannot be cancelled", 400)
  pass.status = GuestPassStatus.CANCELLED
  await pass.save()
  return pass
}

// --- Visit List & Records Aggregation ---

export const getVisitorVisitsPage = async ({
  apartmentId, page, limit, status, includeFlatId = false,
}: ListVisitsInput & { page: number; limit: number; status?: string; includeFlatId?: boolean }) => {
  const filter: Record<string, unknown> = { apartmentId: getApartmentObjectId(apartmentId), ...(status ? { status } : {}) }
  const skip = (page - 1) * limit
  const [visits, total] = await Promise.all([
    VisitorVisitModel.find(filter).populate<{ flatId: { flatNumber: string } | null }>("flatId", "flatNumber").sort({ checkedInAt: -1 }).skip(skip).limit(limit).lean(),
    VisitorVisitModel.countDocuments(filter),
  ])
  const data: VisitorVisitListItem[] = visits.map((v) => ({
    _id: toId(v._id), apartmentId: toId(v.apartmentId), ...(includeFlatId ? { flatId: toId(v.flatId) } : {}),
    flatNumber: v.flatId?.flatNumber ?? null, visitorPassId: v.visitorPassId ? toId(v.visitorPassId) : null,
    visitorName: v.visitorName, visitorPhone: v.visitorPhone ?? null, purpose: v.purpose ?? null,
    vehicleNumber: v.vehicleNumber ?? null, vehicleType: v.vehicleType ?? null, entryType: v.entryType,
    checkedInBy: v.checkedInBy, checkedInAt: v.checkedInAt, checkedOutBy: v.checkedOutBy ?? null,
    checkedOutAt: v.checkedOutAt ?? null, status: v.status, createdAt: v.createdAt, updatedAt: v.updatedAt,
  }))
  const totalPages = Math.ceil(total / limit)
  return { data, pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } }
}

export const getVisitorRecordsService = async ({
  apartmentId, page = 1, limit = 20, status = "ALL", entryType = "ALL", search,
}: ListVisitorRecordsInput) => {
  const aptObjectId = getApartmentObjectId(apartmentId)
  const skip = (page - 1) * limit
  const sRegex = search?.trim() ? new RegExp(escapeRegExp(search.trim()), "i") : null
  const flatLookup: PipelineStage[] = [
    {
      $lookup: {
        from: "flats",
        let: { flatId: "$flatId", aptId: "$apartmentId" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$_id", "$$flatId"] }, { $eq: ["$apartmentId", "$$aptId"] }] } } },
          { $project: { _id: 0, flatNumber: 1 } },
        ],
        as: "flat",
      },
    },
    { $unwind: { path: "$flat", preserveNullAndEmptyArrays: true } },
  ]

  const parkingLookup: PipelineStage[] = [
    {
      $lookup: {
        from: ParkingSlotModel.collection.name,
        localField: "parkingSlotId",
        foreignField: "_id",
        as: "parkingSlot",
      },
    },
    { $unwind: { path: "$parkingSlot", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        parking: {
          $cond: {
            if: { $ifNull: ["$parkingSlot", false] },
            then: {
              _id: "$parkingSlot._id",
              slotId: "$parkingSlot._id",
              slotNumber: "$parkingSlot.slotNumber",
              vehicleNumber: "$vehicleNumber",
              vehicleType: "$vehicleType",
              status: "$status",
              assignedAt: "$checkedInAt",
              assignedBy: "$checkedInBy",
              releasedAt: "$checkedOutAt",
              releasedBy: "$checkedOutBy",
              slot: "$parkingSlot",
            },
            else: null,
          },
        },
      },
    },
  ]

  const searchStage: PipelineStage.Match[] = sRegex
    ? [{ $match: { $or: [{ visitorName: sRegex }, { visitorPhone: sRegex }, { purpose: sRegex }, { vehicleNumber: sRegex }, { vehicleType: sRegex }, { "flat.flatNumber": sRegex }] } }]
    : []

  const visitMatch: Record<string, unknown> = { apartmentId: aptObjectId }
  if (status === "ACTIVE") visitMatch.status = VisitorVisitStatus.ACTIVE
  if (status === "EXITED") visitMatch.status = VisitorVisitStatus.CHECKED_OUT
  if (entryType !== "ALL") visitMatch.entryType = entryType

  const shouldLoadVisits = status === "ALL" || status === "ACTIVE" || status === "EXITED"
  const shouldLoadPasses = (status === "ALL" || status === "UPCOMING") && (entryType === "ALL" || entryType === VisitorEntryType.PASS)

  const visitProj = {
    _id: { $concat: ["visit-", { $toString: "$_id" }] }, source: { $literal: "VISIT" },
    status: { $cond: [{ $eq: ["$status", VisitorVisitStatus.ACTIVE] }, "ACTIVE", "EXITED"] },
    visitId: { $toString: "$_id" }, visitorPassId: { $cond: [{ $ifNull: ["$visitorPassId", false] }, { $toString: "$visitorPassId" }, null] },
    apartmentId: { $toString: "$apartmentId" }, flatId: { $toString: "$flatId" }, flatNumber: { $ifNull: ["$flat.flatNumber", null] },
    visitorName: 1, visitorPhone: 1, purpose: 1, vehicleNumber: 1, vehicleType: { $ifNull: ["$vehicleType", null] },
    entryType: 1, expectedAt: { $literal: null }, validUntil: { $literal: null }, checkedInAt: 1, checkedOutAt: { $ifNull: ["$checkedOutAt", null] },
    parkingAssignmentId: { $toString: "$parking._id" }, parkingSlotId: { $toString: "$parking.slotId" },
    parkingSlotNumber: { $ifNull: ["$parking.slot.slotNumber", null] }, parkingAssignmentStatus: { $ifNull: ["$parking.status", null] },
    parkingAssignedAt: { $ifNull: ["$parking.assignedAt", null] }, parkingReleasedAt: { $ifNull: ["$parking.releasedAt", null] },
    parkingVehicleNumber: { $ifNull: ["$parking.vehicleNumber", null] }, parkingVehicleType: { $ifNull: ["$parking.vehicleType", null] },
    sortAt: "$checkedInAt",
  }

  const passProj = {
    _id: { $concat: ["pass-", { $toString: "$_id" }] }, source: { $literal: "PASS" }, status: { $literal: "UPCOMING" },
    visitId: { $literal: null }, visitorPassId: { $toString: "$_id" }, apartmentId: { $toString: "$apartmentId" },
    flatId: { $toString: "$flatId" }, flatNumber: { $ifNull: ["$flat.flatNumber", null] }, visitorName: 1, visitorPhone: 1,
    purpose: 1, vehicleNumber: 1, vehicleType: { $ifNull: ["$vehicleType", null] }, entryType: { $literal: VisitorEntryType.PASS },
    expectedAt: "$validFrom", validUntil: 1, checkedInAt: { $literal: null }, checkedOutAt: { $literal: null },
    parkingAssignmentId: { $literal: null }, parkingSlotId: { $literal: null }, parkingSlotNumber: { $literal: null },
    parkingAssignmentStatus: { $literal: null }, parkingAssignedAt: { $literal: null }, parkingReleasedAt: { $literal: null },
    parkingVehicleNumber: { $literal: null }, parkingVehicleType: { $literal: null }, sortAt: "$validFrom",
  }

  const baseStages: PipelineStage[] = shouldLoadVisits
    ? [{ $match: visitMatch }, ...flatLookup, ...parkingLookup, ...searchStage, { $project: visitProj }]
    : [{ $match: { _id: null } }]

  const passStages: PipelineStage[] = shouldLoadPasses
    ? [
        {
          $unionWith: {
            coll: GuestPassModel.collection.name,
            pipeline: [
              { $match: { apartmentId: aptObjectId, status: GuestPassStatus.ACTIVE, validUntil: { $gte: new Date() } } },
              {
                $lookup: {
                  from: VisitorVisitModel.collection.name,
                  let: { vPassId: "$_id", aptId: "$apartmentId" },
                  pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$visitorPassId", "$$vPassId"] }, { $eq: ["$apartmentId", "$$aptId"] }] } } }, { $limit: 1 }],
                  as: "used",
                },
              },
              { $match: { used: { $eq: [] } } },
              ...flatLookup, ...searchStage, { $project: passProj },
            ],
          },
        } as unknown as PipelineStage,
      ]
    : []

  const [result] = await VisitorVisitModel.aggregate<VisitorRecordsFacetResult>([
    ...baseStages, ...passStages, { $sort: { sortAt: -1 } },
    { $facet: { records: [{ $skip: skip }, { $limit: limit }, { $project: { sortAt: 0 } }], totalCount: [{ $count: "count" }] } },
  ])
  const total = result?.totalCount[0]?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  return { records: result?.records ?? [], pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } }
}

// --- Gate Check-in, Manual Entry, and Checkout ---

export const checkInVisitorService = async ({ apartmentId, userId, visitorPassId, token }: CheckInVisitorInput) => {
  const tokenHash = token ? hashGuestPassToken(parseGuestPassQrPayload(token)) : null
  const filter = tokenHash ? { tokenHash, apartmentId } : { _id: visitorPassId, apartmentId }
  const pass = await GuestPassModel.findOne(filter)
  if (!pass) throw new AppError("Guest pass not found", 404)

  const now = new Date()
  if (pass.status === GuestPassStatus.CANCELLED) throw new AppError("Guest pass has been cancelled", 400)
  if (pass.status === GuestPassStatus.USED) throw new AppError("This guest pass has already been used", 409)
  if (pass.status === GuestPassStatus.EXPIRED || pass.validUntil <= now) {
    if (pass.status !== GuestPassStatus.EXPIRED) {
      pass.status = GuestPassStatus.EXPIRED
      await pass.save()
    }
    throw new AppError("Guest pass has expired", 400)
  }
  if (pass.validFrom > now) throw new AppError("Guest pass is not valid yet", 400)
  if (pass.status !== GuestPassStatus.ACTIVE) throw new AppError("Guest pass is not active", 400)

  const existing = await VisitorVisitModel.findOne({ visitorPassId: pass._id }).lean()
  if (existing) throw new AppError("This guest pass has already been used for check-in", 409)

  const claimed = await GuestPassModel.findOneAndUpdate(
    { _id: pass._id, apartmentId, ...(tokenHash ? { tokenHash } : {}), status: GuestPassStatus.ACTIVE },
    { $set: { status: GuestPassStatus.USED, usedAt: now, usedBy: userId } },
    { new: true }
  )
  if (!claimed) throw new AppError("This guest pass has already been used", 409)

  try {
    return await VisitorVisitModel.create({
      apartmentId: claimed.apartmentId, flatId: claimed.flatId, visitorPassId: claimed._id,
      visitorName: claimed.visitorName, visitorPhone: claimed.visitorPhone ?? null,
      purpose: claimed.purpose ?? null, vehicleNumber: claimed.vehicleNumber ?? null,
      vehicleType: (claimed as any).vehicleType ?? null,
      entryType: VisitorEntryType.PASS, checkedInBy: userId, checkedInAt: now,
      checkedOutBy: null, checkedOutAt: null, status: VisitorVisitStatus.ACTIVE,
    })
  } catch (error) {
    await GuestPassModel.updateOne({ _id: claimed._id }, { $set: { status: GuestPassStatus.ACTIVE }, $unset: { usedAt: "", usedBy: "" } })
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new AppError("This guest pass has already been used for check-in", 409)
    }
    throw error
  }
}

export const createManualVisitorEntryService = async ({
  apartmentId, userId, flatId, visitorName, visitorPhone, purpose, vehicleNumber, vehicleType, parkingSlotId,
}: ManualVisitorEntryInput) => {
  const normVehicle = vehicleNumber ? normalizeVehicleNumber(vehicleNumber) : null
  const flat = await Flat.findOne({ _id: flatId, apartmentId }).lean()
  if (!flat) throw new AppError("Flat not found in this apartment", 404)

  const dup = await VisitorVisitModel.findOne(
    buildManualVisitorDuplicateFilter({ apartmentId, flatId, visitorName, visitorPhone, vehicleNumber: normVehicle })
  ).select("_id").lean()
  if (dup) throw new AppError("A matching active or recent visitor entry already exists.", 409)

  const visit = await VisitorVisitModel.create({
    apartmentId, flatId, visitorPassId: null, visitorName,
    visitorPhone: visitorPhone?.trim() || null, purpose: purpose?.trim() || null,
    vehicleNumber: normVehicle, vehicleType: vehicleType || null, entryType: VisitorEntryType.MANUAL,
    checkedInBy: userId, checkedInAt: new Date(), checkedOutBy: null, checkedOutAt: null, status: VisitorVisitStatus.ACTIVE,
  })

  if (parkingSlotId && normVehicle && vehicleType) {
    try {
      await assignParkingSlotService({
        apartmentId,
        userId,
        slotId: parkingSlotId,
        flatId,
        visitorVisitId: visit._id.toString(),
        visitorName,
        vehicleNumber: normVehicle,
        vehicleType: vehicleType as any,
        notes: purpose?.trim() || undefined,
      })
    } catch (parkingError) {
      await VisitorVisitModel.deleteOne({ _id: visit._id })
      throw parkingError
    }
  }

  return visit
}

export const checkoutVisitorService = async ({ apartmentId, userId, visitId }: CheckoutVisitorInput) => {
  const visit = await VisitorVisitModel.findOne({ _id: visitId, apartmentId })
  if (!visit) throw new AppError("Visitor visit not found", 404)
  if (visit.status === VisitorVisitStatus.CHECKED_OUT) throw new AppError("Visitor is already checked out", 400)

  const now = new Date()
  const updated = await VisitorVisitModel.findOneAndUpdate(
    { _id: visitId, apartmentId, status: VisitorVisitStatus.ACTIVE },
    { $set: { status: VisitorVisitStatus.CHECKED_OUT, checkedOutBy: userId, checkedOutAt: now } },
    { new: true }
  )
  if (!updated) throw new AppError("Visitor is already checked out", 400)

  try {
    await releaseActiveParkingForVisit({ apartmentId, userId, visitId, releasedAt: now })
  } catch (error) {
    await VisitorVisitModel.updateOne(
      { _id: visitId, apartmentId },
      { $set: { status: VisitorVisitStatus.ACTIVE, checkedOutBy: null, checkedOutAt: null } }
    )
    throw error
  }
  return updated
}

export const getActiveVisitorsService = async ({ apartmentId, page = 1, limit = 10 }: ListVisitsInput) => {
  const result = await getVisitorVisitsPage({ apartmentId, page, limit, status: VisitorVisitStatus.ACTIVE, includeFlatId: true })
  return { visitors: result.data, pagination: result.pagination }
}

export const getVisitorHistoryService = async ({ apartmentId, page = 1, limit = 10 }: ListVisitsInput) => {
  const result = await getVisitorVisitsPage({ apartmentId, page, limit })
  return { visits: result.data, pagination: result.pagination }
}
