import { Types, type PipelineStage } from "mongoose"

import {
  GuestPassModel,
  GuestPassStatus,
} from "./visit.model.js"
import {
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
} from "./visit.model.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import type { ListVisitorRecordsInput } from "./visit.types.js"
import {
  emptyVisitorParkingProjectionFields,
  visitorParkingLookupStages,
  visitorParkingProjectionFields,
  type VisitorRecordParkingFields,
} from "./visit-record-parking.js"

type VisitorRecordItem = {
  _id: string
  source: "PASS" | "VISIT"
  status: "UPCOMING" | "ACTIVE" | "EXITED"
  visitId: string | null
  visitorPassId: string | null
  apartmentId: string
  flatId: string | null
  flatNumber: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: "PASS" | "MANUAL"
  expectedAt?: Date | null
  validUntil?: Date | null
  checkedInAt?: Date | null
  checkedOutAt?: Date | null
  parkingAssignmentId?: string | null
  parkingSlotId?: string | null
  parkingSlotNumber?: string | null
  parkingAssignmentStatus?: string | null
  parkingAssignedAt?: Date | null
  parkingReleasedAt?: Date | null
  parkingVehicleNumber?: string | null
  parkingVehicleType?: string | null
} & VisitorRecordParkingFields

type VisitorRecordsFacetResult = {
  records: VisitorRecordItem[]
  totalCount: Array<{
    count: number
  }>
}

type UnionWithPipelineStage =
  PipelineStage.UnionWithPipelineStage

const getApartmentObjectId = (apartmentId: string) => {
  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment context", 400)
  }

  return new Types.ObjectId(apartmentId)
}

const flatLookupStages: UnionWithPipelineStage[] = [
  {
    $lookup: {
      from: "flats",
      let: {
        flatId: "$flatId",
        apartmentId: "$apartmentId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ["$_id", "$$flatId"],
                },
                {
                  $eq: ["$apartmentId", "$$apartmentId"],
                },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            flatNumber: 1,
          },
        },
      ],
      as: "flat",
    },
  },
  {
    $unwind: {
      path: "$flat",
      preserveNullAndEmptyArrays: true,
    },
  },
]

const getSearchStage = (
  searchRegex: RegExp | null
): PipelineStage.Match[] =>
  searchRegex
    ? [
        {
          $match: {
            $or: [
              { visitorName: searchRegex },
              { visitorPhone: searchRegex },
              { purpose: searchRegex },
              { vehicleNumber: searchRegex },
              { vehicleType: searchRegex },
              { "flat.flatNumber": searchRegex },
            ],
          },
        },
      ]
    : []

const getVisitMatch = ({
  apartmentObjectId,
  status,
  entryType,
}: {
  apartmentObjectId: Types.ObjectId
  status: ListVisitorRecordsInput["status"]
  entryType: ListVisitorRecordsInput["entryType"]
}) => {
  const match: Record<string, unknown> = {
    apartmentId: apartmentObjectId,
  }

  if (status === "ACTIVE") {
    match.status = VisitorVisitStatus.ACTIVE
  }

  if (status === "EXITED") {
    match.status = VisitorVisitStatus.CHECKED_OUT
  }

  if (entryType !== "ALL") {
    match.entryType = entryType
  }

  return match
}

const getVisitStages = ({
  apartmentObjectId,
  status,
  entryType,
  searchRegex,
}: {
  apartmentObjectId: Types.ObjectId
  status: ListVisitorRecordsInput["status"]
  entryType: ListVisitorRecordsInput["entryType"]
  searchRegex: RegExp | null
}): PipelineStage[] => [
  {
    $match: getVisitMatch({
      apartmentObjectId,
      status,
      entryType,
    }),
  },
  ...flatLookupStages,
  ...visitorParkingLookupStages,
  ...getSearchStage(searchRegex),
  {
    $project: {
      _id: {
        $concat: ["visit-", { $toString: "$_id" }],
      },
      source: {
        $literal: "VISIT",
      },
      status: {
        $cond: [
          {
            $eq: ["$status", VisitorVisitStatus.ACTIVE],
          },
          "ACTIVE",
          "EXITED",
        ],
      },
      visitId: {
        $toString: "$_id",
      },
      visitorPassId: {
        $cond: [
          {
            $ifNull: ["$visitorPassId", false],
          },
          {
            $toString: "$visitorPassId",
          },
          null,
        ],
      },
      apartmentId: {
        $toString: "$apartmentId",
      },
      flatId: {
        $toString: "$flatId",
      },
      flatNumber: {
        $ifNull: ["$flat.flatNumber", null],
      },
      visitorName: 1,
      visitorPhone: 1,
      purpose: 1,
      vehicleNumber: 1,
      vehicleType: {
        $ifNull: ["$vehicleType", null],
      },
      entryType: 1,
      expectedAt: {
        $literal: null,
      },
      validUntil: {
        $literal: null,
      },
      checkedInAt: 1,
      checkedOutAt: {
        $ifNull: ["$checkedOutAt", null],
      },
      ...visitorParkingProjectionFields,
      sortAt: "$checkedInAt",
    },
  },
]

const getPassStages = ({
  apartmentObjectId,
  now,
  searchRegex,
}: {
  apartmentObjectId: Types.ObjectId
  now: Date
  searchRegex: RegExp | null
}): UnionWithPipelineStage[] => [
  {
    $match: {
      apartmentId: apartmentObjectId,
      status: GuestPassStatus.ACTIVE,
      validUntil: {
        $gte: now,
      },
    },
  },
  {
    $lookup: {
      from: VisitorVisitModel.collection.name,
      let: {
        visitorPassId: "$_id",
        apartmentId: "$apartmentId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ["$visitorPassId", "$$visitorPassId"],
                },
                {
                  $eq: ["$apartmentId", "$$apartmentId"],
                },
              ],
            },
          },
        },
        {
          $limit: 1,
        },
      ],
      as: "usedVisit",
    },
  },
  {
    $match: {
      usedVisit: {
        $eq: [],
      },
    },
  },
  ...flatLookupStages,
  ...getSearchStage(searchRegex),
  {
    $project: {
      _id: {
        $concat: ["pass-", { $toString: "$_id" }],
      },
      source: {
        $literal: "PASS",
      },
      status: {
        $literal: "UPCOMING",
      },
      visitId: {
        $literal: null,
      },
      visitorPassId: {
        $toString: "$_id",
      },
      apartmentId: {
        $toString: "$apartmentId",
      },
      flatId: {
        $toString: "$flatId",
      },
      flatNumber: {
        $ifNull: ["$flat.flatNumber", null],
      },
      visitorName: 1,
      visitorPhone: 1,
      purpose: 1,
      vehicleNumber: 1,
      vehicleType: {
        $literal: null,
      },
      entryType: {
        $literal: VisitorEntryType.PASS,
      },
      expectedAt: "$validFrom",
      validUntil: 1,
      checkedInAt: {
        $literal: null,
      },
      checkedOutAt: {
        $literal: null,
      },
      ...emptyVisitorParkingProjectionFields,
      sortAt: "$validFrom",
    },
  },
]

export const getVisitorRecordsService = async ({
  apartmentId,
  page = 1,
  limit = 20,
  status = "ALL",
  entryType = "ALL",
  search,
}: ListVisitorRecordsInput) => {
  const apartmentObjectId = getApartmentObjectId(apartmentId)
  const skip = (page - 1) * limit
  const trimmedSearch = search?.trim()
  const searchRegex = trimmedSearch
    ? new RegExp(escapeRegExp(trimmedSearch), "i")
    : null
  const shouldLoadVisits =
    status === "ALL" ||
    status === "ACTIVE" ||
    status === "EXITED"
  const shouldLoadPasses =
    (status === "ALL" || status === "UPCOMING") &&
    (entryType === "ALL" || entryType === VisitorEntryType.PASS)

  const baseStages: PipelineStage[] = shouldLoadVisits
    ? getVisitStages({
        apartmentObjectId,
        status,
        entryType,
        searchRegex,
      })
    : [{ $match: { _id: null } }]

  const passStages: PipelineStage[] = shouldLoadPasses
    ? [
        {
          $unionWith: {
            coll: GuestPassModel.collection.name,
            pipeline: getPassStages({
              apartmentObjectId,
              now: new Date(),
              searchRegex,
            }),
          },
        },
      ]
    : []

  const pipeline: PipelineStage[] = [
    ...baseStages,
    ...passStages,
    {
      $sort: {
        sortAt: -1,
      },
    },
    {
      $facet: {
        records: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              sortAt: 0,
            },
          },
        ],
        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    }
  ]

  const [result] =
    await VisitorVisitModel.aggregate<VisitorRecordsFacetResult>(
      pipeline
    )
  const total = result?.totalCount[0]?.count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    records: result?.records ?? [],
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
