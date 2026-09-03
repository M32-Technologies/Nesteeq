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
import { VisitorEntryType, VisitorVisitStatus } from "../visitors/visit/visit.interface.js"
import { VisitorVisitModel } from "../visitors/visit/visit.model.js"
import { getApartmentFlatsService } from "./security-directory.service.js"
import type {
  ObjectIdLike,
  SecurityActivity,
  SecurityActivityQuery,
} from "./security.interface.js"

const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

const buildDescription = (
  primary: string,
  flatNumber?: string | null
) => {
  if (!flatNumber) return primary

  return `${primary} - Flat ${flatNumber}`
}

const getFlatNumberMap = async (apartmentId: string) => {
  const { flats } = await getApartmentFlatsService(apartmentId)

  return new Map(
    flats.map((flat) => [flat._id, flat.flatNumber])
  )
}

export const getSecurityActivityService = async ({
  apartmentId,
  limit = 8,
}: SecurityActivityQuery) => {
  const [visits, deliveries, assignments, alerts] =
    await Promise.all([
      VisitorVisitModel.find({ apartmentId })
        .sort({ updatedAt: -1 })
        .limit(limit * 2)
        .lean(),

      SecurityDeliveryModel.find({ apartmentId })
        .sort({ updatedAt: -1 })
        .limit(limit * 2)
        .lean(),

      VisitorParkingAssignmentModel.find({ apartmentId })
        .sort({ updatedAt: -1 })
        .limit(limit * 2)
        .lean(),

      EmergencyAlertModel.find({ apartmentId })
        .sort({ updatedAt: -1 })
        .limit(limit * 2)
        .lean(),
    ])

  const flatNumberById = await getFlatNumberMap(apartmentId)
  const slotIds = assignments
    .map((assignment) => toId(assignment.slotId))
    .filter(Boolean)

  const slots = await VisitorParkingSlotModel.find({
    apartmentId,
    _id: {
      $in: slotIds,
    },
  })
    .select("_id slotNumber")
    .lean()

  const slotNumberById = new Map(
    slots.map((slot) => [toId(slot._id), slot.slotNumber])
  )

  const activities: SecurityActivity[] = []

  for (const visit of visits) {
    const visitId = toId(visit._id)
    const flatNumber = flatNumberById.get(toId(visit.flatId))

    activities.push({
      id: `${visitId}-checked-in`,
      type:
        visit.entryType === VisitorEntryType.MANUAL
          ? "VISITOR_MANUAL_REGISTERED"
          : "VISITOR_CHECKED_IN",
      title:
        visit.entryType === VisitorEntryType.MANUAL
          ? "Visitor Manually Registered"
          : "Visitor Checked In",
      description: buildDescription(
        visit.visitorName,
        flatNumber
      ),
      timestamp: visit.checkedInAt,
      status:
        visit.status === VisitorVisitStatus.ACTIVE
          ? "ACTIVE"
          : "EXITED",
      relatedEntityId: visitId,
      actionLabel: "View Visitors",
      href: "/security/visitors",
    })

    if (visit.checkedOutAt) {
      activities.push({
        id: `${visitId}-checked-out`,
        type: "VISITOR_CHECKED_OUT",
        title: "Visitor Checked Out",
        description: buildDescription(
          visit.visitorName,
          flatNumber
        ),
        timestamp: visit.checkedOutAt,
        status: "EXITED",
        relatedEntityId: visitId,
        actionLabel: "View Visitors",
        href: "/security/visitors",
      })
    }
  }

  for (const delivery of deliveries) {
    const deliveryId = toId(delivery._id)
    const flatNumber = flatNumberById.get(toId(delivery.flatId))
    const description = buildDescription(
      delivery.deliveryCompany,
      flatNumber
    )

    activities.push({
      id: `${deliveryId}-received`,
      type: "DELIVERY_RECEIVED",
      title: "Delivery Received",
      description,
      timestamp: delivery.receivedAt,
      status: delivery.status,
      relatedEntityId: deliveryId,
      actionLabel: "View Deliveries",
      href: "/security/deliveries",
    })

    if (delivery.notifiedAt) {
      activities.push({
        id: `${deliveryId}-notified`,
        type: "DELIVERY_NOTIFIED",
        title: "Resident Notified",
        description,
        timestamp: delivery.notifiedAt,
        status: DeliveryStatus.NOTIFIED,
        relatedEntityId: deliveryId,
        actionLabel: "View Deliveries",
        href: "/security/deliveries",
      })
    }

    if (delivery.collectedAt) {
      activities.push({
        id: `${deliveryId}-collected`,
        type: "DELIVERY_COLLECTED",
        title: "Parcel Collected",
        description,
        timestamp: delivery.collectedAt,
        status: DeliveryStatus.COLLECTED,
        relatedEntityId: deliveryId,
        actionLabel: "View Deliveries",
        href: "/security/deliveries",
      })
    }

    if (delivery.returnedAt) {
      activities.push({
        id: `${deliveryId}-returned`,
        type: "DELIVERY_RETURNED",
        title: "Parcel Returned",
        description,
        timestamp: delivery.returnedAt,
        status: DeliveryStatus.RETURNED,
        relatedEntityId: deliveryId,
        actionLabel: "View Deliveries",
        href: "/security/deliveries",
      })
    }
  }

  for (const assignment of assignments) {
    const assignmentId = toId(assignment._id)
    const slotNumber =
      slotNumberById.get(toId(assignment.slotId)) ??
      "Visitor Parking"

    activities.push({
      id: `${assignmentId}-assigned`,
      type: "PARKING_ASSIGNED",
      title: "Parking Assigned",
      description: `${slotNumber} - ${assignment.vehicleNumber}`,
      timestamp: assignment.assignedAt,
      status: VisitorParkingSlotStatus.OCCUPIED,
      relatedEntityId: assignmentId,
      actionLabel: "View Parking",
      href: "/security/parking",
    })

    if (assignment.releasedAt) {
      activities.push({
        id: `${assignmentId}-released`,
        type: "PARKING_RELEASED",
        title: "Parking Released",
        description: `${slotNumber} - ${assignment.vehicleNumber}`,
        timestamp: assignment.releasedAt,
        status:
          assignment.status ===
          VisitorParkingAssignmentStatus.RELEASED
            ? VisitorParkingSlotStatus.AVAILABLE
            : assignment.status,
        relatedEntityId: assignmentId,
        actionLabel: "View Parking",
        href: "/security/parking",
      })
    }
  }

  for (const alert of alerts) {
    const alertId = toId(alert._id)
    const flatNumber = flatNumberById.get(toId(alert.flatId))
    const description = flatNumber
      ? `Flat ${flatNumber}`
      : "Resident alert"

    activities.push({
      id: `${alertId}-triggered`,
      type: "SOS_TRIGGERED",
      title: "SOS Alert Triggered",
      description,
      timestamp: alert.triggeredAt,
      status: EmergencyAlertStatus.ACTIVE,
      relatedEntityId: alertId,
      actionLabel: "View Alerts",
      href: "/security/alerts",
    })

    if (alert.acknowledgedAt) {
      activities.push({
        id: `${alertId}-acknowledged`,
        type: "SOS_ACKNOWLEDGED",
        title: "SOS Alert Acknowledged",
        description,
        timestamp: alert.acknowledgedAt,
        status: EmergencyAlertStatus.ACKNOWLEDGED,
        relatedEntityId: alertId,
        actionLabel: "View Alerts",
        href: "/security/alerts",
      })
    }

    if (alert.respondingAt) {
      activities.push({
        id: `${alertId}-responding`,
        type: "SOS_RESPONDING",
        title: "SOS Marked Responding",
        description,
        timestamp: alert.respondingAt,
        status: EmergencyAlertStatus.RESPONDING,
        relatedEntityId: alertId,
        actionLabel: "View Alerts",
        href: "/security/alerts",
      })
    }

    if (alert.resolvedAt) {
      activities.push({
        id: `${alertId}-resolved`,
        type: "SOS_RESOLVED",
        title: "SOS Resolved",
        description,
        timestamp: alert.resolvedAt,
        status: EmergencyAlertStatus.RESOLVED,
        relatedEntityId: alertId,
        actionLabel: "View Alerts",
        href: "/security/alerts",
      })
    }
  }

  return {
    activities: activities
      .filter((activity) => Boolean(activity.timestamp))
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime()
      )
      .slice(0, limit),
  }
}
