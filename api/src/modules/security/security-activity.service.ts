import { Types, type PipelineStage } from "mongoose"

import { EmergencyAlertModel, EmergencyAlertStatus } from "../alert/alert.model.js"
import { DeliveryStatus } from "../delivery/delivery.interface.js"
import { SecurityDeliveryModel } from "../delivery/delivery.model.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
} from "../parking/parking.interface.js"
import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "../parking/parking.model.js"
import {
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
} from "../visitors/visit/visit.model.js"
import { Flat } from "../flat/flat.model.js"
import type {
  SecurityActivity,
  SecurityActivityQuery,
} from "./security.types.js"

type ActivityValue = string | Record<string, unknown>

const toMongoId = (value: string) =>
  Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value

const flatLookupStages = (): PipelineStage[] => [
  {
    $lookup: {
      from: Flat.collection.name,
      localField: "flatId",
      foreignField: "_id",
      as: "flat",
    },
  },
  {
    $set: {
      flatNumber: {
        $arrayElemAt: ["$flat.flatNumber", 0],
      },
      entityId: {
        $toString: "$_id",
      },
    },
  },
]

const describeWithFlat = (primary: ActivityValue) => ({
  $cond: [
    {
      $and: [
        { $ne: ["$flatNumber", null] },
        { $ne: ["$flatNumber", ""] },
      ],
    },
    { $concat: [primary, " - Flat ", "$flatNumber"] },
    primary,
  ],
})

const flattenEvents: PipelineStage[] = [
  { $unwind: "$events" },
  { $replaceRoot: { newRoot: "$events" } },
  { $match: { timestamp: { $type: "date" } } },
]

const visitorActivityStages = (): PipelineStage[] => [
  ...flatLookupStages(),
  {
    $project: {
      events: [
        {
          id: { $concat: ["$entityId", "-checked-in"] },
          type: {
            $cond: [
              { $eq: ["$entryType", VisitorEntryType.MANUAL] },
              "VISITOR_MANUAL_REGISTERED",
              "VISITOR_CHECKED_IN",
            ],
          },
          title: {
            $cond: [
              { $eq: ["$entryType", VisitorEntryType.MANUAL] },
              "Visitor Manually Registered",
              "Visitor Checked In",
            ],
          },
          description: describeWithFlat("$visitorName"),
          timestamp: "$checkedInAt",
          status: {
            $cond: [
              { $eq: ["$status", VisitorVisitStatus.ACTIVE] },
              "ACTIVE",
              "EXITED",
            ],
          },
          relatedEntityId: "$entityId",
          actionLabel: "View Visitors",
          href: "/security/visitors",
        },
        {
          id: { $concat: ["$entityId", "-checked-out"] },
          type: "VISITOR_CHECKED_OUT",
          title: "Visitor Checked Out",
          description: describeWithFlat("$visitorName"),
          timestamp: "$checkedOutAt",
          status: "EXITED",
          relatedEntityId: "$entityId",
          actionLabel: "View Visitors",
          href: "/security/visitors",
        },
      ],
    },
  },
  ...flattenEvents,
]

const deliveryActivityStages = (): PipelineStage[] => [
  ...flatLookupStages(),
  {
    $project: {
      events: [
        {
          id: { $concat: ["$entityId", "-received"] },
          type: "DELIVERY_RECEIVED",
          title: "Delivery Received",
          description: describeWithFlat("$deliveryCompany"),
          timestamp: "$receivedAt",
          status: "$status",
          relatedEntityId: "$entityId",
          actionLabel: "View Deliveries",
          href: "/security/deliveries",
        },
        {
          id: { $concat: ["$entityId", "-notified"] },
          type: "DELIVERY_NOTIFIED",
          title: "Resident Notified",
          description: describeWithFlat("$deliveryCompany"),
          timestamp: "$notifiedAt",
          status: DeliveryStatus.NOTIFIED,
          relatedEntityId: "$entityId",
          actionLabel: "View Deliveries",
          href: "/security/deliveries",
        },
        {
          id: { $concat: ["$entityId", "-collected"] },
          type: "DELIVERY_COLLECTED",
          title: "Parcel Collected",
          description: describeWithFlat("$deliveryCompany"),
          timestamp: "$collectedAt",
          status: DeliveryStatus.COLLECTED,
          relatedEntityId: "$entityId",
          actionLabel: "View Deliveries",
          href: "/security/deliveries",
        },
        {
          id: { $concat: ["$entityId", "-returned"] },
          type: "DELIVERY_RETURNED",
          title: "Parcel Returned",
          description: describeWithFlat("$deliveryCompany"),
          timestamp: "$returnedAt",
          status: DeliveryStatus.RETURNED,
          relatedEntityId: "$entityId",
          actionLabel: "View Deliveries",
          href: "/security/deliveries",
        },
      ],
    },
  },
  ...flattenEvents,
]

const parkingActivityStages = (): PipelineStage[] => [
  {
    $lookup: {
      from: VisitorParkingSlotModel.collection.name,
      localField: "slotId",
      foreignField: "_id",
      as: "slot",
    },
  },
  {
    $set: {
      slotNumber: {
        $ifNull: [
          { $arrayElemAt: ["$slot.slotNumber", 0] },
          "Visitor Parking",
        ],
      },
      entityId: {
        $toString: "$_id",
      },
    },
  },
  {
    $set: {
      description: { $concat: ["$slotNumber", " - ", "$vehicleNumber"] },
    },
  },
  {
    $project: {
      events: [
        {
          id: { $concat: ["$entityId", "-assigned"] },
          type: "PARKING_ASSIGNED",
          title: "Parking Assigned",
          description: "$description",
          timestamp: "$assignedAt",
          status: VisitorParkingSlotStatus.OCCUPIED,
          relatedEntityId: "$entityId",
          actionLabel: "View Parking",
          href: "/security/parking",
        },
        {
          id: { $concat: ["$entityId", "-released"] },
          type: "PARKING_RELEASED",
          title: "Parking Released",
          description: "$description",
          timestamp: "$releasedAt",
          status: {
            $cond: [
              { $eq: ["$status", VisitorParkingAssignmentStatus.RELEASED] },
              VisitorParkingSlotStatus.AVAILABLE,
              "$status",
            ],
          },
          relatedEntityId: "$entityId",
          actionLabel: "View Parking",
          href: "/security/parking",
        },
      ],
    },
  },
  ...flattenEvents,
]

const alertActivityStages = (): PipelineStage[] => [
  ...flatLookupStages(),
  {
    $set: {
      description: {
        $cond: [
          {
            $and: [
              { $ne: ["$flatNumber", null] },
              { $ne: ["$flatNumber", ""] },
            ],
          },
          { $concat: ["Flat ", "$flatNumber"] },
          "Resident alert",
        ],
      },
    },
  },
  {
    $project: {
      events: [
        {
          id: { $concat: ["$entityId", "-triggered"] },
          type: "SOS_TRIGGERED",
          title: "SOS Alert Triggered",
          description: "$description",
          timestamp: "$triggeredAt",
          status: EmergencyAlertStatus.ACTIVE,
          relatedEntityId: "$entityId",
          actionLabel: "View Alerts",
          href: "/security/alerts",
        },
        {
          id: { $concat: ["$entityId", "-acknowledged"] },
          type: "SOS_ACKNOWLEDGED",
          title: "SOS Alert Acknowledged",
          description: "$description",
          timestamp: "$acknowledgedAt",
          status: EmergencyAlertStatus.ACKNOWLEDGED,
          relatedEntityId: "$entityId",
          actionLabel: "View Alerts",
          href: "/security/alerts",
        },
        {
          id: { $concat: ["$entityId", "-responding"] },
          type: "SOS_RESPONDING",
          title: "SOS Marked Responding",
          description: "$description",
          timestamp: "$respondingAt",
          status: EmergencyAlertStatus.RESPONDING,
          relatedEntityId: "$entityId",
          actionLabel: "View Alerts",
          href: "/security/alerts",
        },
        {
          id: { $concat: ["$entityId", "-resolved"] },
          type: "SOS_RESOLVED",
          title: "SOS Resolved",
          description: "$description",
          timestamp: "$resolvedAt",
          status: EmergencyAlertStatus.RESOLVED,
          relatedEntityId: "$entityId",
          actionLabel: "View Alerts",
          href: "/security/alerts",
        },
      ],
    },
  },
  ...flattenEvents,
]

export const getSecurityActivityService = async ({
  apartmentId,
  limit = 8,
}: SecurityActivityQuery) => {
  const match = { apartmentId: toMongoId(apartmentId) }
  const pipeline = [
    { $match: match },
    ...visitorActivityStages(),
    {
      $unionWith: {
        coll: SecurityDeliveryModel.collection.name,
        pipeline: [{ $match: match }, ...deliveryActivityStages()],
      },
    },
    {
      $unionWith: {
        coll: VisitorParkingAssignmentModel.collection.name,
        pipeline: [{ $match: match }, ...parkingActivityStages()],
      },
    },
    {
      $unionWith: {
        coll: EmergencyAlertModel.collection.name,
        pipeline: [{ $match: match }, ...alertActivityStages()],
      },
    },
    { $sort: { timestamp: -1 } },
    { $limit: limit },
  ] as unknown as PipelineStage[]

  const activities = await VisitorVisitModel.aggregate<SecurityActivity>(
    pipeline
  )

  return { activities }
}
