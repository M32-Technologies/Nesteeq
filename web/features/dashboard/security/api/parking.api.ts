import axiosInstance from "@/lib/axios"

import type {
  AssignParkingPayload,
  GenerateParkingSlotsPayload,
  UpdateParkingSlotPayload,
  VisitorParkingResponse,
  VisitorParkingSlot,
  VisitorParkingSlotStatus,
} from "../schemas/parking"

export const getParkingSlots = async (params: {
  status?: VisitorParkingSlotStatus
  search?: string
  page?: number
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/parking",
    {
      params,
    }
  )

  return response.data.data as VisitorParkingResponse
}

export const assignParkingSlot = async (
  payload: AssignParkingPayload
) => {
  const response = await axiosInstance.post(
    "/api/security/parking/assign",
    payload
  )

  return response.data.data as VisitorParkingResponse
}

export const updateParkingSlotStatus = async ({
  slotId,
  status,
  notes,
}: {
  slotId: string
  status: Exclude<VisitorParkingSlotStatus, "ALL" | "OCCUPIED">
  notes?: string
}) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}/status`,
    {
      status,
      notes,
    }
  )

  return response.data.data as VisitorParkingSlot
}

export const releaseParkingSlot = async (slotId: string) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}/release`
  )

  return response.data.data as VisitorParkingSlot
}

export const generateParkingSlots = async (
  payload: GenerateParkingSlotsPayload
) => {
  const response = await axiosInstance.post(
    "/api/security/parking/generate",
    payload
  )

  return response.data.data as VisitorParkingResponse
}

export const updateParkingSlot = async ({
  slotId,
  slotNumber,
  notes,
}: UpdateParkingSlotPayload) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}`,
    {
      slotNumber,
      notes,
    }
  )

  return response.data.data as VisitorParkingSlot
}
