import type { Types } from "mongoose"

export const DeliveryType = {
  PARCEL: "PARCEL",
  FOOD: "FOOD",
  GROCERY: "GROCERY",
  COURIER: "COURIER",
  OTHER: "OTHER",
} as const

export type DeliveryType =
  (typeof DeliveryType)[keyof typeof DeliveryType]

export const DeliveryStatus = {
  WAITING: "WAITING",
  NOTIFIED: "NOTIFIED",
  COLLECTED: "COLLECTED",
  RETURNED: "RETURNED",
} as const

export type DeliveryStatus =
  (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

export interface ISecurityDelivery {
  apartmentId: Types.ObjectId
  flatId: Types.ObjectId
  residentId?: Types.ObjectId | null
  deliveryType: DeliveryType
  deliveryCompany: string
  deliveryPersonName?: string | null
  deliveryPersonPhone?: string | null
  trackingId?: string | null
  packageDescription?: string | null
  notes?: string | null
  status: DeliveryStatus
  receivedBy: string
  receivedAt: Date
  notifiedBy?: string | null
  notifiedAt?: Date | null
  collectedBy?: string | null
  collectedAt?: Date | null
  returnedBy?: string | null
  returnedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}
