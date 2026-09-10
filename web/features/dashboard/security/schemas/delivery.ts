import type { VisitorPagination } from "./visitor"

export type DeliveryType =
  | "PARCEL"
  | "FOOD"
  | "GROCERY"
  | "COURIER"
  | "OTHER"

export type DeliveryStatus =
  | "ALL"
  | "WAITING"
  | "NOTIFIED"
  | "COLLECTED"
  | "RETURNED"

export interface SecurityDelivery {
  _id: string
  apartmentId: string
  flatId: string
  flatNumber: string | null
  residentId: string | null
  residentName: string | null
  residentPhone: string | null
  deliveryType: Exclude<DeliveryType, "ALL">
  deliveryCompany: string
  deliveryPersonName?: string | null
  deliveryPersonPhone?: string | null
  trackingId?: string | null
  packageDescription?: string | null
  notes?: string | null
  status: Exclude<DeliveryStatus, "ALL">
  receivedBy: string
  receivedAt: string
  notifiedBy?: string | null
  notifiedAt?: string | null
  collectedBy?: string | null
  collectedAt?: string | null
  returnedBy?: string | null
  returnedAt?: string | null
}

export interface DeliveriesResponse {
  deliveries: SecurityDelivery[]
  pagination: VisitorPagination
}

export interface CreateDeliveryPayload {
  deliveryType: DeliveryType
  flatId: string
  residentId?: string
  deliveryCompany: string
  deliveryPersonName?: string
  deliveryPersonPhone?: string
  trackingId?: string
  packageDescription?: string
  notes?: string
}
