import { Types } from "mongoose"

import {
  ensureFlatInApartment,
  ensureResidentInApartment,
  getApartmentFlatsService,
  getUserSummariesByIds,
} from "../security/security-directory.service.js"
import { validateDeliveryStatusTransition } from "../security/security-status-transitions.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import {
  DeliveryStatus,
  type DeliveryStatus as DeliveryStatusType,
  type DeliveryType as DeliveryTypeValue,
  type ISecurityDelivery,
} from "./delivery.interface.js"
import { SecurityDeliveryModel } from "./delivery.model.js"
import { ResidentModel } from "../resident/resident.model.js"

type ObjectIdLike = {
  toString: () => string
}

type LeanDelivery = ISecurityDelivery & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
  residentId?: ObjectIdLike | null
}

type CreateDeliveryInput = {
  apartmentId: string
  userId: string
  flatId: string
  residentId?: string
  deliveryType: DeliveryTypeValue
  deliveryCompany: string
  deliveryPersonName?: string
  deliveryPersonPhone?: string
  trackingId?: string
  packageDescription?: string
  notes?: string
}

type ListDeliveriesInput = {
  apartmentId: string
  status?: "ALL" | DeliveryStatusType
  search?: string
  page?: number
  limit?: number
}

type UpdateDeliveryStatusInput = {
  apartmentId: string
  userId: string
  deliveryId: string
  status: DeliveryStatusType
  notes?: string
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

const enrichDeliveries = async (
  apartmentId: string,
  deliveries: LeanDelivery[]
) => {
  const flatNumberById = await getFlatNumberById(apartmentId)
  const residentIds = deliveries
    .map((delivery) => toId(delivery.residentId))
    .filter(Boolean)

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

  return deliveries.map((delivery) => {
    const resident = residentById.get(toId(delivery.residentId))
    const user = resident
      ? usersById.get(resident.userId)
      : null

    return {
      _id: toId(delivery._id),
      apartmentId: toId(delivery.apartmentId),
      flatId: toId(delivery.flatId),
      flatNumber:
        flatNumberById.get(toId(delivery.flatId)) ?? null,
      residentId: toId(delivery.residentId) || null,
      residentName: user?.name ?? null,
      residentPhone:
        resident?.phone ?? user?.phone ?? null,
      deliveryType: delivery.deliveryType,
      deliveryCompany: delivery.deliveryCompany,
      deliveryPersonName: delivery.deliveryPersonName ?? null,
      deliveryPersonPhone:
        delivery.deliveryPersonPhone ?? null,
      trackingId: delivery.trackingId ?? null,
      packageDescription:
        delivery.packageDescription ?? null,
      notes: delivery.notes ?? null,
      status: delivery.status,
      receivedBy: delivery.receivedBy,
      receivedAt: delivery.receivedAt,
      notifiedBy: delivery.notifiedBy ?? null,
      notifiedAt: delivery.notifiedAt ?? null,
      collectedBy: delivery.collectedBy ?? null,
      collectedAt: delivery.collectedAt ?? null,
      returnedBy: delivery.returnedBy ?? null,
      returnedAt: delivery.returnedAt ?? null,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }
  })
}

const findFlatIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const flats = await getApartmentFlatsService(apartmentId)
  const query = search.toLowerCase()

  return flats.flats
    .filter((flat) =>
      flat.flatNumber.toLowerCase().includes(query)
    )
    .map((flat) => new Types.ObjectId(flat._id))
}

const findResidentIdsForSearch = async (
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

export const createDeliveryService = async ({
  apartmentId,
  userId,
  flatId,
  residentId,
  deliveryType,
  deliveryCompany,
  deliveryPersonName,
  deliveryPersonPhone,
  trackingId,
  packageDescription,
  notes,
}: CreateDeliveryInput) => {
  await ensureFlatInApartment({
    apartmentId,
    flatId,
  })

  if (residentId) {
    await ensureResidentInApartment({
      apartmentId,
      residentId,
      flatId,
    })
  }

  const delivery = await SecurityDeliveryModel.create({
    apartmentId,
    flatId,
    residentId: residentId || null,
    deliveryType,
    deliveryCompany,
    deliveryPersonName:
      normalizeText(deliveryPersonName),
    deliveryPersonPhone:
      normalizeText(deliveryPersonPhone),
    trackingId: normalizeText(trackingId),
    packageDescription:
      normalizeText(packageDescription),
    notes: normalizeText(notes),
    status: DeliveryStatus.WAITING,
    receivedBy: userId,
    receivedAt: new Date(),
  })

  const enriched = await enrichDeliveries(apartmentId, [
    delivery.toObject() as LeanDelivery,
  ])

  return enriched[0]
}

export const listDeliveriesService = async ({
  apartmentId,
  status = "ALL",
  search,
  page = 1,
  limit = 20,
}: ListDeliveriesInput) => {
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
      findFlatIdsForSearch(apartmentId, trimmedSearch),
      findResidentIdsForSearch(apartmentId, trimmedSearch),
    ])

    filter.$or = [
      { deliveryCompany: regex },
      { deliveryPersonName: regex },
      { deliveryPersonPhone: regex },
      { trackingId: regex },
      { packageDescription: regex },
      { notes: regex },
      ...(flatIds.length > 0
        ? [{ flatId: { $in: flatIds } }]
        : []),
      ...(residentIds.length > 0
        ? [{ residentId: { $in: residentIds } }]
        : []),
    ]
  }

  const skip = (page - 1) * limit
  const [deliveries, total] = await Promise.all([
    SecurityDeliveryModel.find(filter)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    SecurityDeliveryModel.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)
  const records = await enrichDeliveries(
    apartmentId,
    deliveries as unknown as LeanDelivery[]
  )

  return {
    deliveries: records,
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

export const updateDeliveryStatusService = async ({
  apartmentId,
  userId,
  deliveryId,
  status,
  notes,
}: UpdateDeliveryStatusInput) => {
  const delivery = await SecurityDeliveryModel.findOne({
    _id: deliveryId,
    apartmentId,
  })

  if (!delivery) {
    throw new AppError("Delivery not found", 404)
  }

  validateDeliveryStatusTransition(delivery.status, status)

  const now = new Date()

  if (status === DeliveryStatus.NOTIFIED) {
    delivery.status = DeliveryStatus.NOTIFIED
    delivery.notifiedBy = userId
    delivery.notifiedAt = now
  }

  if (status === DeliveryStatus.COLLECTED) {
    delivery.status = DeliveryStatus.COLLECTED
    delivery.collectedBy = userId
    delivery.collectedAt = now
  }

  if (status === DeliveryStatus.RETURNED) {
    delivery.status = DeliveryStatus.RETURNED
    delivery.returnedBy = userId
    delivery.returnedAt = now
  }

  if (notes) {
    delivery.notes = notes
  }

  await delivery.save()

  const enriched = await enrichDeliveries(apartmentId, [
    delivery.toObject() as LeanDelivery,
  ])

  return enriched[0]
}
