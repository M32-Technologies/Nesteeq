import {
  EmergencyAlertStatus,
  type EmergencyAlertStatus as EmergencyAlertStatusType,
} from "../alert/alert.model.js"
import {
  DeliveryStatus,
  type DeliveryStatus as DeliveryStatusType,
} from "../delivery/delivery.interface.js"
import { AppError } from "../../utils/AppError.js"

export const deliveryUpdateStatuses = [
  DeliveryStatus.NOTIFIED,
  DeliveryStatus.COLLECTED,
  DeliveryStatus.RETURNED,
] as const

export const emergencyAlertUpdateStatuses = [
  EmergencyAlertStatus.ACKNOWLEDGED,
  EmergencyAlertStatus.RESPONDING,
  EmergencyAlertStatus.RESOLVED,
] as const

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

const alertTransitions: Record<
  EmergencyAlertStatusType,
  readonly EmergencyAlertStatusType[]
> = {
  [EmergencyAlertStatus.ACTIVE]: [
    EmergencyAlertStatus.ACKNOWLEDGED,
    EmergencyAlertStatus.RESPONDING,
    EmergencyAlertStatus.RESOLVED,
  ],
  [EmergencyAlertStatus.ACKNOWLEDGED]: [
    EmergencyAlertStatus.RESPONDING,
    EmergencyAlertStatus.RESOLVED,
  ],
  [EmergencyAlertStatus.RESPONDING]: [
    EmergencyAlertStatus.RESOLVED,
  ],
  [EmergencyAlertStatus.RESOLVED]: [],
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

export const canTransitionEmergencyAlertStatus = (
  currentStatus: EmergencyAlertStatusType,
  nextStatus: EmergencyAlertStatusType
) => alertTransitions[currentStatus].includes(nextStatus)

export const validateEmergencyAlertStatusTransition = (
  currentStatus: EmergencyAlertStatusType,
  nextStatus: EmergencyAlertStatusType
) => {
  if (currentStatus === nextStatus) {
    throw new AppError(
      `Emergency alert is already ${currentStatus}.`,
      400
    )
  }

  if (
    !canTransitionEmergencyAlertStatus(
      currentStatus,
      nextStatus
    )
  ) {
    throw new AppError(
      `Invalid alert status transition from ${currentStatus} to ${nextStatus}.`,
      400
    )
  }
}
