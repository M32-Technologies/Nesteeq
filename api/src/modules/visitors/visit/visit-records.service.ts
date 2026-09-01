import { Types } from "mongoose"

import { Flat } from "../../flat/flat.model.js"
import {
  GuestPassModel,
  GuestPassStatus,
  type GuestPass,
} from "../pass/pass.model.js"
import {
  type IVisitorVisit,
  VisitorEntryType,
  VisitorVisitStatus,
} from "./visit.interface.js"
import { VisitorVisitModel } from "./visit.model.js"
import { escapeRegExp } from "../../../utils/regex.js"

type ObjectIdLike = {
  toString: () => string
}

type LeanFlat = {
  _id: ObjectIdLike
  flatNumber: string
}

type LeanGuestPass = GuestPass & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
}

type LeanVisitorVisit = IVisitorVisit & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
  visitorPassId?: ObjectIdLike | null
}

interface ListVisitorRecordsInput {
  apartmentId: string
  page?: number
  limit?: number
  status?: "ALL" | "UPCOMING" | "ACTIVE" | "EXITED"
  entryType?: "ALL" | VisitorEntryType
  search?: string
}

const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

const getFlatIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const flats = await Flat.find({
    apartmentId,
    flatNumber: new RegExp(escapeRegExp(search), "i"),
  })
    .select("_id")
    .lean()

  return (flats as unknown as Array<{ _id: ObjectIdLike }>).map(
    (flat) => new Types.ObjectId(toId(flat._id))
  )
}

const getFlatNumberMap = async (
  apartmentId: string,
  flatIds: string[]
) => {
  const uniqueFlatIds = Array.from(new Set(flatIds.filter(Boolean)))

  if (uniqueFlatIds.length === 0) {
    return new Map<string, string>()
  }

  const flats = await Flat.find({
    apartmentId,
    _id: {
      $in: uniqueFlatIds,
    },
  })
    .select("_id flatNumber")
    .lean()

  return new Map(
    (flats as unknown as LeanFlat[]).map((flat) => [
      toId(flat._id),
      flat.flatNumber,
    ])
  )
}

export const getVisitorRecordsService = async ({
  apartmentId,
  page = 1,
  limit = 20,
  status = "ALL",
  entryType = "ALL",
  search,
}: ListVisitorRecordsInput) => {
  const trimmedSearch = search?.trim()
  const flatIds = trimmedSearch
    ? await getFlatIdsForSearch(apartmentId, trimmedSearch)
    : []
  const searchRegex = trimmedSearch
    ? new RegExp(escapeRegExp(trimmedSearch), "i")
    : null

  const visitFilter: Record<string, unknown> = {
    apartmentId,
  }

  if (status === "ACTIVE") {
    visitFilter.status = VisitorVisitStatus.ACTIVE
  }

  if (status === "EXITED") {
    visitFilter.status = VisitorVisitStatus.CHECKED_OUT
  }

  if (entryType !== "ALL") {
    visitFilter.entryType = entryType
  }

  if (searchRegex) {
    visitFilter.$or = [
      { visitorName: searchRegex },
      { visitorPhone: searchRegex },
      { purpose: searchRegex },
      { vehicleNumber: searchRegex },
      ...(flatIds.length > 0
        ? [{ flatId: { $in: flatIds } }]
        : []),
    ]
  }

  const shouldLoadVisits =
    status === "ALL" ||
    status === "ACTIVE" ||
    status === "EXITED"

  const shouldLoadPasses =
    (status === "ALL" || status === "UPCOMING") &&
    (entryType === "ALL" || entryType === VisitorEntryType.PASS)

  const [visits, usedPassIds] = await Promise.all([
    shouldLoadVisits
      ? VisitorVisitModel.find(visitFilter)
          .sort({ checkedInAt: -1 })
          .lean()
      : Promise.resolve([]),

    shouldLoadPasses
      ? VisitorVisitModel.distinct("visitorPassId", {
          apartmentId,
          visitorPassId: {
            $ne: null,
          },
        })
      : Promise.resolve([]),
  ])

  const passFilter: Record<string, unknown> = {
    apartmentId,
    status: GuestPassStatus.ACTIVE,
    validUntil: {
      $gte: new Date(),
    },
    _id: {
      $nin: usedPassIds,
    },
  }

  if (searchRegex) {
    passFilter.$or = [
      { visitorName: searchRegex },
      { visitorPhone: searchRegex },
      { purpose: searchRegex },
      { vehicleNumber: searchRegex },
      ...(flatIds.length > 0
        ? [{ flatId: { $in: flatIds } }]
        : []),
    ]
  }

  const passes = shouldLoadPasses
    ? await GuestPassModel.find(passFilter)
        .sort({ validFrom: -1 })
        .lean()
    : []

  const visitRecords =
    visits as unknown as LeanVisitorVisit[]
  const passRecords =
    passes as unknown as LeanGuestPass[]

  const flatNumberById = await getFlatNumberMap(
    apartmentId,
    [
      ...visitRecords.map((visit) => toId(visit.flatId)),
      ...passRecords.map((pass) => toId(pass.flatId)),
    ]
  )

  const records = [
    ...passRecords.map((pass) => ({
      _id: `pass-${toId(pass._id)}`,
      source: "PASS" as const,
      status: "UPCOMING" as const,
      visitId: null,
      visitorPassId: toId(pass._id),
      apartmentId: toId(pass.apartmentId),
      flatId: toId(pass.flatId),
      flatNumber:
        flatNumberById.get(toId(pass.flatId)) ?? null,
      visitorName: pass.visitorName,
      visitorPhone: pass.visitorPhone ?? null,
      purpose: pass.purpose ?? null,
      vehicleNumber: pass.vehicleNumber ?? null,
      entryType: VisitorEntryType.PASS,
      expectedAt: pass.validFrom,
      validUntil: pass.validUntil,
      checkedInAt: null,
      checkedOutAt: null,
      sortAt: pass.validFrom,
    })),

    ...visitRecords.map((visit) => ({
      _id: `visit-${toId(visit._id)}`,
      source: "VISIT" as const,
      status:
        visit.status === VisitorVisitStatus.ACTIVE
          ? ("ACTIVE" as const)
          : ("EXITED" as const),
      visitId: toId(visit._id),
      visitorPassId: toId(visit.visitorPassId) || null,
      apartmentId: toId(visit.apartmentId),
      flatId: toId(visit.flatId),
      flatNumber:
        flatNumberById.get(toId(visit.flatId)) ?? null,
      visitorName: visit.visitorName,
      visitorPhone: visit.visitorPhone ?? null,
      purpose: visit.purpose ?? null,
      vehicleNumber: visit.vehicleNumber ?? null,
      entryType: visit.entryType,
      expectedAt: null,
      validUntil: null,
      checkedInAt: visit.checkedInAt,
      checkedOutAt: visit.checkedOutAt ?? null,
      sortAt: visit.checkedInAt,
    })),
  ].sort(
    (left, right) =>
      new Date(right.sortAt).getTime() -
      new Date(left.sortAt).getTime()
  )

  const total = records.length
  const totalPages = Math.ceil(total / limit)
  const skip = (page - 1) * limit

  return {
    records: records
      .slice(skip, skip + limit)
      .map(({ sortAt: _sortAt, ...record }) => record),
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
