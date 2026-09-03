import { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import { ResidentModel } from "../resident/resident.model.js"
import {
  ensureFlatInApartment,
  ensureResidentInApartment,
  getApartmentFlatsService,
  getUserSummariesByIds,
} from "../security/security-directory.service.js"
import { validateEmergencyAlertStatusTransition } from "../security/security-status-transitions.js"
import {
  EmergencyAlertModel,
  EmergencyAlertStatus,
  EmergencyAlertType,
  type EmergencyAlertStatus as EmergencyAlertStatusType,
  type EmergencyAlertType as EmergencyAlertTypeValue,
  type IEmergencyAlert,
} from "./alert.model.js"

type ObjectIdLike = {
  toString: () => string
}

type LeanEmergencyAlert = IEmergencyAlert & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  residentId: ObjectIdLike
  flatId: ObjectIdLike
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

const enrichAlerts = async (
  apartmentId: string,
  alerts: LeanEmergencyAlert[]
) => {
  const flatNumberById = await getFlatNumberById(apartmentId)
  const residentIds = alerts.map((alert) =>
    toId(alert.residentId)
  )

  const residents = await ResidentModel.find({
    _id: {
      $in: residentIds,
    },
    apartmentId,
  })
    .select("_id userId phone residentType status")
    .lean()

  const residentRecords = residents as unknown as Array<{
    _id: ObjectIdLike
    userId: string
    phone?: string | null
    residentType: string
    status: string
  }>

  const usersById = await getUserSummariesByIds(
    residentRecords.map((resident) => resident.userId)
  )
  const residentById = new Map(
    residentRecords.map((resident) => [
      toId(resident._id),
      resident,
    ])
  )

  return alerts.map((alert) => {
    const resident = residentById.get(toId(alert.residentId))
    const user = resident
      ? usersById.get(resident.userId)
      : null

    return {
      _id: toId(alert._id),
      apartmentId: toId(alert.apartmentId),
      residentId: toId(alert.residentId),
      residentName: user?.name ?? null,
      residentPhone:
        resident?.phone ?? user?.phone ?? null,
      flatId: toId(alert.flatId),
      flatNumber:
        flatNumberById.get(toId(alert.flatId)) ?? null,
      alertType: alert.alertType,
      message: alert.message ?? null,
      status: alert.status,
      triggeredBy: alert.triggeredBy,
      triggeredAt: alert.triggeredAt,
      acknowledgedBy: alert.acknowledgedBy ?? null,
      acknowledgedAt: alert.acknowledgedAt ?? null,
      respondingBy: alert.respondingBy ?? null,
      respondingAt: alert.respondingAt ?? null,
      resolvedBy: alert.resolvedBy ?? null,
      resolvedAt: alert.resolvedAt ?? null,
      resolutionNotes: alert.resolutionNotes ?? null,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    }
  })
}

const getResidentIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const residents = await ResidentModel.find({
    apartmentId,
  })
    .select("_id userId phone")
    .lean()

  const residentRecords = residents as unknown as Array<{
    _id: ObjectIdLike
    userId: string
    phone?: string | null
  }>

  const usersById = await getUserSummariesByIds(
    residentRecords.map((resident) => resident.userId)
  )
  const query = search.toLowerCase()

  return residentRecords
    .filter((resident) => {
      const user = usersById.get(resident.userId)

      return [
        user?.name,
        user?.email,
        user?.phone,
        resident.phone,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    })
    .map((resident) => new Types.ObjectId(toId(resident._id)))
}

const getFlatIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const { flats } = await getApartmentFlatsService(apartmentId)
  const query = search.toLowerCase()

  return flats
    .filter((flat) =>
      flat.flatNumber.toLowerCase().includes(query)
    )
    .map((flat) => new Types.ObjectId(flat._id))
}

export const createEmergencyAlertService = async ({
  apartmentId,
  userId,
  userRole,
  alertType = EmergencyAlertType.SOS,
  message,
  residentId,
  flatId,
}: {
  apartmentId: string
  userId: string
  userRole?: string
  alertType?: EmergencyAlertTypeValue
  message?: string
  residentId?: string
  flatId?: string
}) => {
  const normalizedRole = userRole
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

  let resolvedResidentId = residentId
  let resolvedFlatId = flatId

  if (normalizedRole === "resident") {
    const resident = await ResidentModel.findOne({
      userId,
      apartmentId,
      status: "active",
    })

    if (!resident) {
      throw new AppError(
        "Active resident profile not found",
        404
      )
    }

    resolvedResidentId = resident._id.toString()
    resolvedFlatId = resident.flatId.toString()
  }

  if (!resolvedResidentId || !resolvedFlatId) {
    throw new AppError(
      "Resident and flat are required for this alert",
      400
    )
  }

  await ensureFlatInApartment({
    apartmentId,
    flatId: resolvedFlatId,
  })

  await ensureResidentInApartment({
    apartmentId,
    residentId: resolvedResidentId,
    flatId: resolvedFlatId,
  })

  const alert = await EmergencyAlertModel.create({
    apartmentId,
    residentId: resolvedResidentId,
    flatId: resolvedFlatId,
    alertType,
    message: normalizeText(message),
    status: EmergencyAlertStatus.ACTIVE,
    triggeredBy: userId,
    triggeredAt: new Date(),
  })

  const enriched = await enrichAlerts(apartmentId, [
    alert.toObject() as LeanEmergencyAlert,
  ])

  return enriched[0]
}

export const listEmergencyAlertsService = async ({
  apartmentId,
  status = "ALL",
  search,
  page = 1,
  limit = 20,
}: {
  apartmentId: string
  status?: "ALL" | EmergencyAlertStatusType
  search?: string
  page?: number
  limit?: number
}) => {
  const filter: Record<string, unknown> = {
    apartmentId,
  }

  if (status !== "ALL") {
    filter.status = status
  }

  const trimmedSearch = search?.trim()

  if (trimmedSearch) {
    const regex = new RegExp(
      escapeRegExp(trimmedSearch),
      "i"
    )
    const [flatIds, residentIds] = await Promise.all([
      getFlatIdsForSearch(apartmentId, trimmedSearch),
      getResidentIdsForSearch(apartmentId, trimmedSearch),
    ])

    filter.$or = [
      { alertType: regex },
      { message: regex },
      { resolutionNotes: regex },
      ...(flatIds.length > 0
        ? [{ flatId: { $in: flatIds } }]
        : []),
      ...(residentIds.length > 0
        ? [{ residentId: { $in: residentIds } }]
        : []),
    ]
  }

  const skip = (page - 1) * limit
  const [alerts, total] = await Promise.all([
    EmergencyAlertModel.find(filter)
      .sort({ triggeredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    EmergencyAlertModel.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    alerts: await enrichAlerts(
      apartmentId,
      alerts as unknown as LeanEmergencyAlert[]
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const updateEmergencyAlertStatusService = async ({
  apartmentId,
  userId,
  alertId,
  status,
  resolutionNotes,
}: {
  apartmentId: string
  userId: string
  alertId: string
  status: EmergencyAlertStatusType
  resolutionNotes?: string
}) => {
  const alert = await EmergencyAlertModel.findOne({
    _id: alertId,
    apartmentId,
  })

  if (!alert) {
    throw new AppError("Emergency alert not found", 404)
  }

  validateEmergencyAlertStatusTransition(alert.status, status)

  const now = new Date()

  if (status === EmergencyAlertStatus.ACKNOWLEDGED) {
    alert.status = EmergencyAlertStatus.ACKNOWLEDGED
    alert.acknowledgedBy = userId
    alert.acknowledgedAt = now
  }

  if (status === EmergencyAlertStatus.RESPONDING) {
    alert.status = EmergencyAlertStatus.RESPONDING
    alert.respondingBy = userId
    alert.respondingAt = now

    if (!alert.acknowledgedAt) {
      alert.acknowledgedBy = userId
      alert.acknowledgedAt = now
    }
  }

  if (status === EmergencyAlertStatus.RESOLVED) {
    alert.status = EmergencyAlertStatus.RESOLVED
    alert.resolvedBy = userId
    alert.resolvedAt = now
    alert.resolutionNotes =
      normalizeText(resolutionNotes)
  }

  await alert.save()

  const enriched = await enrichAlerts(apartmentId, [
    alert.toObject() as LeanEmergencyAlert,
  ])

  return enriched[0]
}
