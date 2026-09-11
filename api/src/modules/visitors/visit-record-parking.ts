import type { PipelineStage } from "mongoose"

import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "../parking/parking.model.js"

export type VisitorRecordParkingFields = {
  parkingAssignmentId?: string | null
  parkingSlotId?: string | null
  parkingSlotNumber?: string | null
  parkingAssignmentStatus?: string | null
  parkingAssignedAt?: Date | null
  parkingReleasedAt?: Date | null
  parkingVehicleNumber?: string | null
  parkingVehicleType?: string | null
}

export const visitorParkingLookupStages: PipelineStage[] = [
  {
    $lookup: {
      from: VisitorParkingAssignmentModel.collection.name,
      let: { visitId: "$_id", apartmentId: "$apartmentId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$visitorVisitId", "$$visitId"] },
                { $eq: ["$apartmentId", "$$apartmentId"] },
              ],
            },
          },
        },
        { $sort: { assignedAt: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: VisitorParkingSlotModel.collection.name,
            localField: "slotId",
            foreignField: "_id",
            as: "slot",
          },
        },
        {
          $unwind: {
            path: "$slot",
            preserveNullAndEmptyArrays: true,
          },
        },
      ],
      as: "parking",
    },
  },
  {
    $unwind: {
      path: "$parking",
      preserveNullAndEmptyArrays: true,
    },
  },
]

export const visitorParkingProjectionFields = {
  parkingAssignmentId: { $toString: "$parking._id" },
  parkingSlotId: { $toString: "$parking.slotId" },
  parkingSlotNumber: { $ifNull: ["$parking.slot.slotNumber", null] },
  parkingAssignmentStatus: { $ifNull: ["$parking.status", null] },
  parkingAssignedAt: { $ifNull: ["$parking.assignedAt", null] },
  parkingReleasedAt: { $ifNull: ["$parking.releasedAt", null] },
  parkingVehicleNumber: { $ifNull: ["$parking.vehicleNumber", null] },
  parkingVehicleType: { $ifNull: ["$parking.vehicleType", null] },
}

export const emptyVisitorParkingProjectionFields =
  Object.fromEntries(
    Object.keys(visitorParkingProjectionFields).map((key) => [
      key,
      { $literal: null },
    ])
  )
