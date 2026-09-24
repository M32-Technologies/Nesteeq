import crypto from "crypto"
import { Types } from "mongoose"

import { getAuthDB } from "../../config/auth-db.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import { EmergencyAlertModel, EmergencyAlertStatus } from "../alert/alert.model.js"
import { DeliveryStatus } from "../delivery/delivery.interface.js"
import { SecurityDeliveryModel } from "../delivery/delivery.model.js"
import { Flat } from "../flat/flat.model.js"
import {
  ParkingSlotStatus,
  ParkingUsageType,
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IParkingSlot,
  type ParkingSummary,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "../parking/parking.interface.js"
import { ParkingSlotModel } from "../parking/parking.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import {
  GuestPassModel,
  GuestPassStatus,
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
} from "../visitors/visit.model.js"
import type {
  BetterAuthUser,
  LeanFlat,
  LeanResident,
  ObjectIdLike,
  ResidentDirectoryRecord,
  ResidentSummary,
  SecurityActivity,
  SecurityActivityQuery,
  SecurityResidentsQuery,
  SecuritySummary,
  VerifyGuestPassInput,
} from "./security.types.js"

const toId = (val: ObjectIdLike | string | null | undefined) => val?.toString() ?? ""
const toMongoId = (val: string) => (Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : val)
const toObjectId = (val: string, label: string) => {
  if (!Types.ObjectId.isValid(val)) throw new AppError(`Invalid ${label}`, 400)
  return new Types.ObjectId(val)
}

const hashGuestPassToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

const parseGuestPassQrPayload = (payload: string) => {
  const trimmed = payload.trim()
  if (!trimmed) return ""
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed && typeof parsed === "object" && "token" in parsed && typeof parsed.token === "string") {
      return parsed.token.trim()
    }
  } catch {}
  try {
    const url = new URL(trimmed)
    const t = url.searchParams.get("token") ?? url.searchParams.get("guestPassToken") ?? url.searchParams.get("visitorToken") ?? url.searchParams.get("passToken")
    if (t) return t.trim()
  } catch {}
  const match = trimmed.match(/^(?:nesteeq:)?visitor-pass[:/](.+)$/i)
  return match?.[1]?.trim() ?? trimmed
}

export const getUserSummariesByIds = async (userIds: string[]) => {
  const unique = Array.from(new Set(userIds.filter(Boolean)))
  if (!unique.length) return new Map<string, BetterAuthUser>()
  const objIds = unique.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id))
  const users = (await getAuthDB()
    .collection("user")
    .find({ $or: [{ id: { $in: unique } }, ...(objIds.length ? [{ _id: { $in: objIds } }] : [])] })
    .project({ _id: 1, id: 1, name: 1, email: 1, phone: 1 })
    .toArray()) as BetterAuthUser[]
  const map = new Map<string, BetterAuthUser>()
  for (const u of users) {
    if (u.id) map.set(u.id, u)
    if (u._id) map.set(toId(u._id), u)
  }
  return map
}

export const getApartmentFlatsService = async (apartmentId: string) => {
  const [flats, residents] = await Promise.all([
    Flat.find({ apartmentId, status: "active" }).select("_id flatNumber occupancyStatus").sort({ flatNumber: 1 }).lean<LeanFlat[]>(),
    ResidentModel.find({ apartmentId, status: "active" }).select("_id userId flatId residentType phoneNumber status").sort({ joinedAt: -1 }).lean<LeanResident[]>(),
  ])
  const usersById = await getUserSummariesByIds(residents.map((r) => r.userId))
  const residentsByFlat = new Map<string, ResidentSummary[]>()
  for (const r of residents) {
    const fId = toId(r.flatId)
    const u = usersById.get(r.userId)
    const list = residentsByFlat.get(fId) ?? []
    list.push({
      _id: toId(r._id),
      userId: r.userId,
      name: u?.name ?? null,
      email: u?.email ?? null,
      phone: r.phoneNumber ?? u?.phone ?? null,
      residentType: r.residentType,
      status: r.status,
    })
    residentsByFlat.set(fId, list)
  }
  return {
    flats: flats.map((f) => ({
      _id: toId(f._id),
      flatNumber: f.flatNumber,
      occupancyStatus: f.occupancyStatus ?? null,
      residents: residentsByFlat.get(toId(f._id)) ?? [],
    })),
  }
}

export const getMatchingUserIdsForSearch = async (search: string) => {
  const regex = new RegExp(escapeRegExp(search), "i")
  const users = (await getAuthDB()
    .collection("user")
    .find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
    .project({ _id: 1, id: 1 })
    .toArray()) as Pick<BetterAuthUser, "_id" | "id">[]
  return users.flatMap((u) => [u.id, toId(u._id)]).filter(Boolean) as string[]
}

export const getMatchingFlatIdsForSearch = (apartmentId: string, search: string) =>
  Flat.distinct("_id", { apartmentId, status: "active", flatNumber: new RegExp(escapeRegExp(search), "i") })

export const getApartmentResidentsService = async ({
  apartmentId,
  search,
  page = 1,
  limit = 20,
}: {
  apartmentId: string
  search?: string
  page?: number
  limit?: number
}) => {
  const skip = (page - 1) * limit
  const activeFlatIds = await Flat.distinct("_id", { apartmentId, status: "active" })
  const filter: Record<string, unknown> = { apartmentId, status: "active", flatId: { $in: activeFlatIds } }
  const trimmed = search?.trim()
  if (trimmed) {
    const regex = new RegExp(escapeRegExp(trimmed), "i")
    const [flatIds, userIds] = await Promise.all([
      getMatchingFlatIdsForSearch(apartmentId, trimmed),
      getMatchingUserIdsForSearch(trimmed),
    ])
    filter.$or = [
      { phoneNumber: regex },
      { residentType: regex },
      { status: regex },
      ...(flatIds.length ? [{ flatId: { $in: flatIds } }] : []),
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ]
  }
  const [residents, total] = await Promise.all([
    ResidentModel.find(filter)
      .select("_id userId apartmentId flatId residentType phoneNumber status joinedAt")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<LeanResident[]>(),
    ResidentModel.countDocuments(filter),
  ])
  const [usersById, flats] = await Promise.all([
    getUserSummariesByIds(residents.map((r) => r.userId)),
    Flat.find({ _id: { $in: residents.map((r) => r.flatId) }, apartmentId, status: "active" })
      .select("_id flatNumber occupancyStatus")
      .lean<LeanFlat[]>(),
  ])
  const flatsById = new Map(flats.map((f) => [toId(f._id), f]))
  const records: ResidentDirectoryRecord[] = residents.map((r) => {
    const u = usersById.get(r.userId)
    const f = flatsById.get(toId(r.flatId))
    return {
      _id: toId(r._id),
      userId: r.userId,
      apartmentId: toId(r.apartmentId),
      flatId: toId(r.flatId),
      flatNumber: f?.flatNumber ?? null,
      name: u?.name ?? null,
      email: u?.email ?? null,
      phone: r.phoneNumber ?? u?.phone ?? null,
      residentType: r.residentType,
      status: r.status,
      joinedAt: r.joinedAt ?? null,
    }
  })
  const totalPages = Math.ceil(total / limit)
  return {
    residents: records,
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  }
}

export const ensureFlatInApartment = async ({ apartmentId, flatId }: { apartmentId: string; flatId: string }) => {
  if (!Types.ObjectId.isValid(flatId)) throw new AppError("Invalid flat ID", 400)
  const flat = await Flat.findOne({ _id: flatId, apartmentId, status: "active" }).lean<LeanFlat>()
  if (!flat) throw new AppError("Flat not found in this apartment", 404)
  return flat
}

export const ensureResidentInApartment = async ({
  apartmentId,
  residentId,
  flatId,
  allowedStatuses = ["active"],
}: {
  apartmentId: string
  residentId: string
  flatId?: string
  allowedStatuses?: string[]
}) => {
  if (!Types.ObjectId.isValid(residentId)) throw new AppError("Invalid resident ID", 400)
  const filter: Record<string, unknown> = {
    _id: residentId,
    apartmentId,
    status: { $in: allowedStatuses },
    ...(flatId ? { flatId } : {}),
  }
  const res = await ResidentModel.findOne(filter).lean<LeanResident>()
  if (!res) throw new AppError("Resident not found in this apartment", 404)
  return res
}

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export const getSecurityActivityService = async ({ apartmentId, limit = 8 }: SecurityActivityQuery) => {
  const mId = toMongoId(apartmentId)
  const [visits, deliveries, parkingVisits, alerts] = await Promise.all([
    VisitorVisitModel.find({ apartmentId: mId }).sort({ checkedInAt: -1 }).limit(limit).lean(),
    SecurityDeliveryModel.find({ apartmentId: mId }).sort({ receivedAt: -1 }).limit(limit).lean(),
    VisitorVisitModel.find({ apartmentId: mId, parkingSlotId: { $ne: null } }).sort({ checkedInAt: -1 }).limit(limit).lean(),
    EmergencyAlertModel.find({ apartmentId: mId }).sort({ triggeredAt: -1 }).limit(limit).lean(),
  ])

  const flatIds = Array.from(new Set([
    ...visits.map((v) => toId(v.flatId)),
    ...deliveries.map((d) => toId(d.flatId)),
    ...alerts.map((a) => toId(a.flatId)),
  ].filter(Boolean)))
  const slotIds = parkingVisits.map((p) => toId(p.parkingSlotId)).filter(Boolean)

  const [flats, managerSlots] = await Promise.all([
    flatIds.length ? Flat.find({ _id: { $in: flatIds } }).select("_id flatNumber").lean<{ _id: Types.ObjectId; flatNumber: string }[]>() : [],
    slotIds.length ? ParkingSlotModel.find({ _id: { $in: slotIds } }).select("_id slotNumber").lean<{ _id: Types.ObjectId; slotNumber: string }[]>() : [],
  ])

  const flatMap = new Map(flats.map((f) => [toId(f._id), f.flatNumber]))
  const slotMap = new Map([
    ...managerSlots.map((s) => [toId(s._id), s.slotNumber] as const),
  ])

  const descFlat = (primary: string, fId: unknown) => {
    const fn = flatMap.get(toId(fId as ObjectIdLike))
    return fn ? `${primary} - Flat ${fn}` : primary
  }

  const events: SecurityActivity[] = []

  for (const v of visits) {
    const entId = toId(v._id)
    const isManual = v.entryType === VisitorEntryType.MANUAL
    events.push({
      id: `${entId}-checked-in`,
      type: isManual ? "VISITOR_MANUAL_REGISTERED" : "VISITOR_CHECKED_IN",
      title: isManual ? "Visitor Manually Registered" : "Visitor Checked In",
      description: descFlat(v.visitorName, v.flatId),
      timestamp: v.checkedInAt,
      status: v.status === VisitorVisitStatus.ACTIVE ? "ACTIVE" : "EXITED",
      relatedEntityId: entId,
      actionLabel: "View Visitors",
      href: "/security/visitors",
    })
    if (v.checkedOutAt) {
      events.push({
        id: `${entId}-checked-out`,
        type: "VISITOR_CHECKED_OUT",
        title: "Visitor Checked Out",
        description: descFlat(v.visitorName, v.flatId),
        timestamp: v.checkedOutAt,
        status: "EXITED",
        relatedEntityId: entId,
        actionLabel: "View Visitors",
        href: "/security/visitors",
      })
    }
  }

  for (const d of deliveries) {
    const entId = toId(d._id)
    events.push({
      id: `${entId}-received`,
      type: "DELIVERY_RECEIVED",
      title: "Delivery Received",
      description: descFlat(d.deliveryCompany, d.flatId),
      timestamp: d.receivedAt,
      status: d.status,
      relatedEntityId: entId,
      actionLabel: "View Deliveries",
      href: "/security/deliveries",
    })
    if (d.collectedAt) {
      events.push({
        id: `${entId}-collected`,
        type: "DELIVERY_COLLECTED",
        title: "Parcel Collected",
        description: descFlat(d.deliveryCompany, d.flatId),
        timestamp: d.collectedAt,
        status: DeliveryStatus.COLLECTED,
        relatedEntityId: entId,
        actionLabel: "View Deliveries",
        href: "/security/deliveries",
      })
    }
    if (d.returnedAt) {
      events.push({
        id: `${entId}-returned`,
        type: "DELIVERY_RETURNED",
        title: "Parcel Returned",
        description: descFlat(d.deliveryCompany, d.flatId),
        timestamp: d.returnedAt,
        status: DeliveryStatus.RETURNED,
        relatedEntityId: entId,
        actionLabel: "View Deliveries",
        href: "/security/deliveries",
      })
    }
  }

  for (const p of parkingVisits) {
    const entId = toId(p._id)
    const slotNo = p.parkingSlotId ? (slotMap.get(toId(p.parkingSlotId)) ?? "Visitor Parking") : "Visitor Parking"
    const desc = `${slotNo} - ${p.vehicleNumber || p.visitorName}`
    events.push({
      id: `${entId}-assigned`,
      type: "PARKING_ASSIGNED",
      title: "Parking Assigned",
      description: desc,
      timestamp: p.checkedInAt,
      status: VisitorParkingSlotStatus.OCCUPIED,
      relatedEntityId: entId,
      actionLabel: "View Parking",
      href: "/security/parking",
    })
    if (p.checkedOutAt) {
      events.push({
        id: `${entId}-released`,
        type: "PARKING_RELEASED",
        title: "Parking Released",
        description: desc,
        timestamp: p.checkedOutAt,
        status: VisitorParkingSlotStatus.AVAILABLE,
        relatedEntityId: entId,
        actionLabel: "View Parking",
        href: "/security/parking",
      })
    }
  }

  for (const a of alerts) {
    const entId = toId(a._id)
    const fn = flatMap.get(toId(a.flatId))
    const desc = fn ? `Flat ${fn}` : "Resident alert"
    const stages: Array<[Date | null | undefined, string, SecurityActivity["type"], string, EmergencyAlertStatus]> = [
      [a.triggeredAt, "triggered", "SOS_TRIGGERED", "SOS Alert Triggered", EmergencyAlertStatus.ACTIVE],
      [a.acknowledgedAt, "acknowledged", "SOS_ACKNOWLEDGED", "SOS Alert Acknowledged", EmergencyAlertStatus.ACKNOWLEDGED],
      [a.respondingAt, "responding", "SOS_RESPONDING", "SOS Marked Responding", EmergencyAlertStatus.RESPONDING],
      [a.resolvedAt, "resolved", "SOS_RESOLVED", "SOS Resolved", EmergencyAlertStatus.RESOLVED],
    ]
    for (const [ts, suffix, type, title, status] of stages) {
      if (ts) {
        events.push({
          id: `${entId}-${suffix}`,
          type,
          title,
          description: desc,
          timestamp: ts,
          status,
          relatedEntityId: entId,
          actionLabel: "View Alerts",
          href: "/security/alerts",
        })
      }
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return { activities: events.slice(0, limit) }
}

const getSecurityVisitorParkingSummary = async (apartmentId: string): Promise<ParkingSummary> => {
  const aptId = toObjectId(apartmentId, "apartment context")
  const rows = await ParkingSlotModel.aggregate<{ _id: IParkingSlot["status"]; count: number }>([
    { $match: { apartmentId: aptId, usageType: ParkingUsageType.VISITOR } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])
  const summary: ParkingSummary = { totalVisitorSlots: 0, available: 0, occupied: 0, reserved: 0, unavailable: 0 }
  for (const { _id, count } of rows) {
    summary.totalVisitorSlots += count
    if (_id === ParkingSlotStatus.AVAILABLE) summary.available += count
    else if (_id === ParkingSlotStatus.INACTIVE) summary.unavailable += count
    else summary.occupied += count
  }
  return summary
}

export const verifyGuestPassService = async ({ token, apartmentId }: VerifyGuestPassInput) => {
  const tokenHash = hashGuestPassToken(parseGuestPassQrPayload(token))
  const pass = await GuestPassModel.findOne({ tokenHash, apartmentId }).select("+tokenHash").lean()
  if (!pass) throw new AppError("Invalid guest pass", 404)
  if (pass.status === GuestPassStatus.CANCELLED) throw new AppError("Guest pass has been cancelled", 400)
  if (pass.status === GuestPassStatus.USED) throw new AppError("This guest pass has already been used", 409)
  const now = new Date()
  if (pass.status === GuestPassStatus.EXPIRED || pass.validUntil <= now) {
    await GuestPassModel.updateOne({ _id: pass._id }, { $set: { status: GuestPassStatus.EXPIRED } })
    throw new AppError("Guest pass has expired", 400)
  }
  if (pass.validFrom > now) throw new AppError("Guest pass is not valid yet", 400)
  if (pass.status !== GuestPassStatus.ACTIVE) throw new AppError("Guest pass is not active", 400)
  const existingVisit = await VisitorVisitModel.findOne({ visitorPassId: pass._id }).lean()
  if (existingVisit) throw new AppError("This guest pass has already been used", 409)

  const { tokenHash: _, ...safePass } = pass
  const flat = await Flat.findOne({ _id: pass.flatId, apartmentId }).select("flatNumber").lean()
  return { ...safePass, flatNumber: flat?.flatNumber ?? null }
}

export const getSecuritySummaryService = async (apartmentId: string): Promise<SecuritySummary> => {
  const now = new Date()
  const { start, end } = getTodayRange()
  const usedPassIds = await VisitorVisitModel.distinct("visitorPassId", { apartmentId, visitorPassId: { $ne: null } })

  const [visitorsInside, upcomingVisitors, deliveriesWaiting, parkingSummary, activeSosAlerts, upcomingToday, checkedInToday, checkedOutToday] =
    await Promise.all([
      VisitorVisitModel.countDocuments({ apartmentId, status: VisitorVisitStatus.ACTIVE }),
      GuestPassModel.countDocuments({ apartmentId, status: GuestPassStatus.ACTIVE, validUntil: { $gte: now }, _id: { $nin: usedPassIds } }),
      SecurityDeliveryModel.countDocuments({ apartmentId, status: { $in: [DeliveryStatus.WAITING, DeliveryStatus.NOTIFIED] } }),
      getSecurityVisitorParkingSummary(apartmentId),
      EmergencyAlertModel.countDocuments({ apartmentId, status: EmergencyAlertStatus.ACTIVE }),
      GuestPassModel.countDocuments({ apartmentId, status: GuestPassStatus.ACTIVE, validFrom: { $lt: end }, validUntil: { $gte: now }, _id: { $nin: usedPassIds } }),
      VisitorVisitModel.countDocuments({ apartmentId, checkedInAt: { $gte: start, $lt: end } }),
      VisitorVisitModel.countDocuments({ apartmentId, status: VisitorVisitStatus.CHECKED_OUT, checkedOutAt: { $gte: start, $lt: end } }),
    ])

  return {
    visitorsInside,
    upcomingVisitors,
    deliveriesWaiting,
    availableVisitorParking: parkingSummary.available,
    activeSosAlerts,
    reservedVisitorParking: parkingSummary.reserved,
    occupiedVisitorParking: parkingSummary.occupied,
    unavailableVisitorParking: parkingSummary.unavailable,
    upcomingVisitorsToday: upcomingToday,
    checkedInToday,
    checkedOutToday,
  }
}

export const getSecurityFlatsService = (apartmentId: string) => getApartmentFlatsService(apartmentId)
export const getSecurityResidentsService = ({ apartmentId, search, page, limit }: SecurityResidentsQuery) =>
  getApartmentResidentsService({ apartmentId, search, page, limit })
