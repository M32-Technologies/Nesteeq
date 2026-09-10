import { Types, type PipelineStage } from "mongoose"

import { AppError } from "../../../utils/AppError.js"
import { VisitorVisitModel } from "./visit.model.js"
import type { ListVisitsInput } from "./visit.types.js"

type VisitorVisitListItem = {
  _id: string
  apartmentId: string
  flatId?: string
  flatNumber: string | null
  visitorPassId?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: string
  checkedInBy: string
  checkedInAt: Date
  checkedOutBy?: string | null
  checkedOutAt?: Date | null
  status: string
  createdAt?: Date
  updatedAt?: Date
}

type VisitorVisitFacetResult = {
  data: VisitorVisitListItem[]
  totalCount: Array<{
    count: number
  }>
}

const getApartmentObjectId = (apartmentId: string) => {
  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment context", 400)
  }

  return new Types.ObjectId(apartmentId)
}

export const getVisitorVisitsPage = async ({
  apartmentId,
  page,
  limit,
  status,
  includeFlatId = false,
}: ListVisitsInput & {
  page: number
  limit: number
  status?: string
  includeFlatId?: boolean
}) => {
  const skip = (page - 1) * limit

  const [result] =
    await VisitorVisitModel.aggregate<VisitorVisitFacetResult>([
      {
        $match: {
          apartmentId: getApartmentObjectId(apartmentId),
          ...(status ? { status } : {}),
        },
      } satisfies PipelineStage.Match,
      {
        $sort: {
          checkedInAt: -1,
        },
      },
      {
        $facet: {
          data: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
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
            {
              $project: {
                _id: {
                  $toString: "$_id",
                },
                apartmentId: {
                  $toString: "$apartmentId",
                },
                flatId: includeFlatId
                  ? {
                      $toString: "$flatId",
                    }
                  : "$$REMOVE",
                flatNumber: {
                  $ifNull: ["$flat.flatNumber", null],
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
                visitorName: 1,
                visitorPhone: 1,
                purpose: 1,
                vehicleNumber: 1,
                vehicleType: 1,
                entryType: 1,
                checkedInBy: 1,
                checkedInAt: 1,
                checkedOutBy: 1,
                checkedOutAt: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      },
    ])

  const total = result?.totalCount[0]?.count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: result?.data ?? [],
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
