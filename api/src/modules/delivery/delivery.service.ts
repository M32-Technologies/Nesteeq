import {
  ensureFlatInApartment,
  ensureResidentInApartment,
  getApartmentFlatsService,
  getMatchingFlatIdsForSearch,
  getMatchingUserIdsForSearch,
  getUserSummariesByIds,
} from "../security/security.service.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import {
  type ActivityFacetItem,
  type CreateDeliveryInput,
  type DeliveryActivityItem,
  type DeliveryAnalyticsFacetResult,
  type DeliveryAnalyticsRange,
  type DeliveryAnalyticsResponseData,
  DeliveryStatus,
  type DeliveryStatus as DeliveryStatusType,
  type DeliverySummaryStats,
  type DeliveryType as DeliveryTypeValue,
  type GetDeliveryAnalyticsInput,
  type ISecurityDelivery,
  type LeanDelivery,
  type ListDeliveriesInput,
  type ObjectIdLike,
  type ResolveDateRangeOptions,
  type ResolvedDateRange,
  type SummaryFacetItem,
  type UpdateDeliveryStatusInput,
} from "./delivery.types.js"
import { SecurityDeliveryModel } from "./delivery.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import { type PipelineStage, Types } from "mongoose"
const deliveryTransitions: Record<
  DeliveryStatusType,
  readonly DeliveryStatusType[]
> = {
  [DeliveryStatus.WAITING]: [
    DeliveryStatus.NOTIFIED,
    DeliveryStatus.COLLECTED,
    DeliveryStatus.RETURNED,
  ],
  [DeliveryStatus.NOTIFIED]: [
    DeliveryStatus.COLLECTED,
    DeliveryStatus.RETURNED,
  ],
  [DeliveryStatus.COLLECTED]: [],
  [DeliveryStatus.RETURNED]: [],
}

export const canTransitionDeliveryStatus = (
  currentStatus: DeliveryStatusType,
  nextStatus: DeliveryStatusType
) => deliveryTransitions[currentStatus].includes(nextStatus)

export const validateDeliveryStatusTransition = (
  currentStatus: DeliveryStatusType,
  nextStatus: DeliveryStatusType
) => {
  if (currentStatus === nextStatus) {
    throw new AppError(
      `Delivery is already ${currentStatus}.`,
      400
    )
  }

  if (!canTransitionDeliveryStatus(currentStatus, nextStatus)) {
    throw new AppError(
      `Invalid delivery status transition from ${currentStatus} to ${nextStatus}.`,
      400
    )
  }
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
  const { flats } = await getApartmentFlatsService(apartmentId)
  const flatById = new Map(
    flats.map((flat) => [flat._id, flat])
  )

  const explicitResidentIds = deliveries
    .map((delivery) => toId(delivery.residentId))
    .filter(Boolean)

  const flatIds = deliveries
    .map((delivery) => toId(delivery.flatId))
    .filter(Boolean)

  const orConditions: Array<Record<string, unknown>> = []
  if (explicitResidentIds.length) {
    orConditions.push({ _id: { $in: explicitResidentIds } })
  }
  if (flatIds.length) {
    orConditions.push({
      flatId: { $in: flatIds },
      status: { $in: ["active", "pending"] },
    })
  }

  const residentsQuery: Record<string, unknown> = {
    apartmentId,
  }
  if (orConditions.length) {
    residentsQuery.$or = orConditions
  }

  const residents = orConditions.length
    ? await ResidentModel.find(residentsQuery)
        .sort({ residentType: 1, joinedAt: -1 })
        .select("_id userId flatId phoneNumber residentType status")
        .lean()
    : []

  const residentRecords = residents as unknown as Array<{
    _id: ObjectIdLike
    userId: string
    flatId: ObjectIdLike
    phoneNumber?: string | null
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

  // Index residents by flatId (prioritize active residents, then owners)
  const residentByFlatId = new Map<string, typeof residentRecords[0]>()
  for (const resident of residentRecords) {
    const fId = toId(resident.flatId)
    const existing = residentByFlatId.get(fId)
    if (!existing || (existing.status !== "active" && resident.status === "active")) {
      residentByFlatId.set(fId, resident)
    }
  }

  return deliveries.map((delivery) => {
    const flat = flatById.get(toId(delivery.flatId))

    // 1. Try explicitly linked resident
    const explicitResident = residentById.get(toId(delivery.residentId))
    // 2. Fall back to flat's active/pending resident
    const flatResident = residentByFlatId.get(toId(delivery.flatId))
    const resident = explicitResident ?? flatResident

    const user = resident ? usersById.get(resident.userId) : null
    const summaryResident = (!user && flat?.residents?.length) ? flat.residents[0] : null

    const resolvedResidentId = resident ? toId(resident._id) : (summaryResident?._id ?? null)
    const resolvedResidentName = user?.name ?? summaryResident?.name ?? null
    const resolvedResidentPhone =
      resident?.phoneNumber ?? user?.phone ?? summaryResident?.phone ?? null

    return {
      _id: toId(delivery._id),
      apartmentId: toId(delivery.apartmentId),
      flatId: toId(delivery.flatId),
      flatNumber: flat?.flatNumber ?? null,
      residentId: resolvedResidentId,
      residentName: resolvedResidentName,
      residentPhone: resolvedResidentPhone,
      deliveryType: delivery.deliveryType,
      deliveryCompany: delivery.deliveryCompany,
      deliveryPersonName: delivery.deliveryPersonName ?? null,
      deliveryPersonPhone:
        delivery.deliveryPersonPhone ?? null,
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

const findResidentIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const regex = new RegExp(escapeRegExp(search), "i")
  const userIds = await getMatchingUserIdsForSearch(search)

  return ResidentModel.distinct("_id", {
    apartmentId,
    $or: [
      { phoneNumber: regex },
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ],
  })
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
  packageDescription,
  notes,
}: CreateDeliveryInput) => {
  await ensureFlatInApartment({
    apartmentId,
    flatId,
  })

  let resolvedResidentId = residentId ? toId(residentId) : null

  if (resolvedResidentId) {
    await ensureResidentInApartment({
      apartmentId,
      residentId: resolvedResidentId,
      flatId,
    })
  } else {
    // Automatically find the resident living in this flat
    const activeResident = await ResidentModel.findOne({
      apartmentId,
      flatId,
      status: { $in: ["active", "pending"] },
    })
      .sort({ residentType: 1, joinedAt: -1 })
      .select("_id")
      .lean()

    if (activeResident) {
      resolvedResidentId = toId(activeResident._id)
    }
  }

  const delivery = await SecurityDeliveryModel.create({
    apartmentId,
    flatId,
    residentId: resolvedResidentId || null,
    deliveryType,
    deliveryCompany,
    deliveryPersonName:
      normalizeText(deliveryPersonName),
    deliveryPersonPhone:
      normalizeText(deliveryPersonPhone),
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

export const getDeliveryByIdService = async (
  apartmentId: string,
  deliveryId: string
) => {
  if (!Types.ObjectId.isValid(deliveryId)) {
    throw new AppError("Invalid delivery ID", 400);
  }

  const delivery = await SecurityDeliveryModel.findOne({
    _id: deliveryId,
    apartmentId,
  }).lean();

  if (!delivery) {
    throw new AppError("Delivery not found", 404);
  }

  const enriched = await enrichDeliveries(
    apartmentId,
    [delivery as unknown as LeanDelivery]
  );

  return enriched[0];
};

export const listDeliveriesService = async ({
  apartmentId,
  status = "ALL",
  deliveryType = "ALL",
  search,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}: ListDeliveriesInput) => {
  const filter: Record<string, unknown> = {
    apartmentId,
  }

  if (status !== "ALL") {
    filter.status = status
  }

  if (deliveryType && deliveryType !== "ALL") {
    filter.deliveryType = deliveryType
  }

  // Date range filter on receivedAt
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}

    if (startDate) {
      dateFilter.$gte = new Date(startDate)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.$lte = end
    }

    filter.receivedAt = dateFilter
  }

  const trimmedSearch = search?.trim()

  if (trimmedSearch) {
    const regex = new RegExp(
      escapeRegExp(trimmedSearch),
      "i"
    )
    const [flatIds, residentIds] = await Promise.all([
      getMatchingFlatIdsForSearch(apartmentId, trimmedSearch),
      findResidentIdsForSearch(apartmentId, trimmedSearch),
    ])

    const residentFlatIds = residentIds.length
      ? await ResidentModel.distinct("flatId", {
          _id: { $in: residentIds },
        })
      : []

    const allFlatIds = Array.from(
      new Set([...flatIds, ...residentFlatIds.map(toId)])
    )

    filter.$or = [
      { deliveryCompany: regex },
      { deliveryPersonName: regex },
      { deliveryPersonPhone: regex },
      { packageDescription: regex },
      { notes: regex },
      ...(allFlatIds.length > 0
        ? [{ flatId: { $in: allFlatIds } }]
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

const createUtcDate = (
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date => {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, second, ms))
}

export const formatDateToYMD = (date: Date): string => {
  return date.toISOString().slice(0, 10)
}

export const resolveDeliveryDateRange = (
  range: DeliveryAnalyticsRange,
  options?: ResolveDateRangeOptions
): ResolvedDateRange => {
  const now = options?.now ?? new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()

  let start: Date
  let end: Date

  switch (range) {
    case "7d":
      end = createUtcDate(year, month, day + 1)
      start = createUtcDate(year, month, day + 1 - 7)
      break

    case "30d":
      end = createUtcDate(year, month, day + 1)
      start = createUtcDate(year, month, day + 1 - 30)
      break

    case "thisMonth":
      start = createUtcDate(year, month, 1)
      end = createUtcDate(year, month + 1, 1)
      break

    case "lastMonth":
      start = createUtcDate(year, month - 1, 1)
      end = createUtcDate(year, month, 1)
      break

    default:
      throw new Error(`Unsupported delivery analytics range: ${range}`)
  }

  return {
    range,
    start,
    end,
    startDateStr: formatDateToYMD(start),
    endDateStr: formatDateToYMD(end),
  }
}

export const generateContinuousTimeline = (
  start: Date,
  end: Date,
  receivedMap: Map<string, number>,
  collectedMap: Map<string, number>,
  returnedMap: Map<string, number>
): DeliveryActivityItem[] => {
  const activity: DeliveryActivityItem[] = []
  let current = new Date(start)

  while (current.getTime() < end.getTime()) {
    const dateKey = formatDateToYMD(current)

    activity.push({
      date: dateKey,
      received: receivedMap.get(dateKey) ?? 0,
      collected: collectedMap.get(dateKey) ?? 0,
      returned: returnedMap.get(dateKey) ?? 0,
    })

    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return activity
}

export const getDeliveryAnalyticsService = async ({
  apartmentId,
  range = "30d",
  options,
}: GetDeliveryAnalyticsInput): Promise<DeliveryAnalyticsResponseData> => {
  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment ID", 400)
  }

  const aptObjectId = new Types.ObjectId(apartmentId)
  const { start, end, startDateStr, endDateStr } =
    resolveDeliveryDateRange(range, options)

  const aggregationPipeline: PipelineStage[] = [
    {
      $match: {
        apartmentId: aptObjectId,
        $or: [
          { receivedAt: { $gte: start, $lt: end } },
          { collectedAt: { $gte: start, $lt: end } },
          { returnedAt: { $gte: start, $lt: end } },
        ],
      },
    },
    {
      $facet: {
        summary: [
          {
            $match: {
              receivedAt: { $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              waiting: {
                $sum: {
                  $cond: [{ $eq: ["$status", DeliveryStatus.WAITING] }, 1, 0],
                },
              },
              notified: {
                $sum: {
                  $cond: [{ $eq: ["$status", DeliveryStatus.NOTIFIED] }, 1, 0],
                },
              },
              collected: {
                $sum: {
                  $cond: [{ $eq: ["$status", DeliveryStatus.COLLECTED] }, 1, 0],
                },
              },
              returned: {
                $sum: {
                  $cond: [{ $eq: ["$status", DeliveryStatus.RETURNED] }, 1, 0],
                },
              },
            },
          },
        ],
        receivedActivity: [
          {
            $match: {
              receivedAt: { $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$receivedAt",
                },
              },
              count: { $sum: 1 },
            },
          },
        ],
        collectedActivity: [
          {
            $match: {
              collectedAt: { $ne: null, $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$collectedAt",
                },
              },
              count: { $sum: 1 },
            },
          },
        ],
        returnedActivity: [
          {
            $match: {
              returnedAt: { $ne: null, $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$returnedAt",
                },
              },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]

  const [result] =
    await SecurityDeliveryModel.aggregate<DeliveryAnalyticsFacetResult>(
      aggregationPipeline
    )

  const rawSummary = result?.summary?.[0]
  const summary: DeliverySummaryStats = {
    total: rawSummary?.total ?? 0,
    waiting: rawSummary?.waiting ?? 0,
    notified: rawSummary?.notified ?? 0,
    collected: rawSummary?.collected ?? 0,
    returned: rawSummary?.returned ?? 0,
  }

  const receivedMap = new Map<string, number>()
  for (const item of result?.receivedActivity ?? []) {
    if (item._id) {
      receivedMap.set(item._id, item.count)
    }
  }

  const collectedMap = new Map<string, number>()
  for (const item of result?.collectedActivity ?? []) {
    if (item._id) {
      collectedMap.set(item._id, item.count)
    }
  }

  const returnedMap = new Map<string, number>()
  for (const item of result?.returnedActivity ?? []) {
    if (item._id) {
      returnedMap.set(item._id, item.count)
    }
  }

  const activity = generateContinuousTimeline(
    start,
    end,
    receivedMap,
    collectedMap,
    returnedMap
  )

  return {
    range,
    dateRange: {
      start: startDateStr,
      end: endDateStr,
    },
    summary,
    activity,
  }
}

