import axiosInstance from "@/lib/axios"

import type {
  CreateDeliveryPayload,
  DeliveriesResponse,
  DeliveryStatus,
  SecurityDelivery,
} from "../schemas/delivery"

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
