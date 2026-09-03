import axiosInstance from "@/lib/axios"

import type { VisitorPagination } from "./visitor.service"

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

export const getDeliveries = async (params: {
  status?: DeliveryStatus
  search?: string
  page?: number
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/deliveries",
    {
      params,
    }
  )

  return response.data.data as DeliveriesResponse
}

export const createDelivery = async (
  payload: CreateDeliveryPayload
) => {
  const response = await axiosInstance.post(
    "/api/security/deliveries",
    payload
  )

  return response.data.data as SecurityDelivery
}

export const updateDeliveryStatus = async ({
  deliveryId,
  status,
  notes,
}: {
  deliveryId: string
  status: Exclude<DeliveryStatus, "ALL">
  notes?: string
}) => {
  const response = await axiosInstance.patch(
    `/api/security/deliveries/${deliveryId}/status`,
    {
      status,
      notes,
    }
  )

  return response.data.data as SecurityDelivery
}
