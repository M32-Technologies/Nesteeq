import { isAxiosError } from "axios"
import api from "@/lib/axios"
import type {
  AssignResidentParkingInput,
  GenerateParkingSlotsInput,
  GenerateParkingSlotsResponse,
  ParkingFilterParams,
  ParkingSlot,
  ParkingSlotsListResponse,
  ParkingStats,
  UpdateParkingSlotInput,
} from "../types/parking.types"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  error?: string
  details?: unknown
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export const getParkingSlots = async (
  params: ParkingFilterParams = {}
): Promise<ParkingSlotsListResponse> => {
  try {
    const cleanParams: Record<string, unknown> = {}
    if (params.search?.trim()) cleanParams.search = params.search.trim()
    if (params.vehicleType) cleanParams.vehicleType = params.vehicleType
    if (params.usageType) cleanParams.usageType = params.usageType
    if (params.status) cleanParams.status = params.status
    if (params.level?.trim()) cleanParams.level = params.level.trim()
    if (params.zoneCode?.trim()) cleanParams.zoneCode = params.zoneCode.trim().toUpperCase()
    if (params.page) cleanParams.page = params.page
    if (params.limit) cleanParams.limit = params.limit
    if (params.sortBy) cleanParams.sortBy = params.sortBy
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder

    const response = await api.get<ApiResponse<ParkingSlotsListResponse>>(
      "/api/v1/parking",
      {
        params: cleanParams,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch parking slots")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch parking slots"))
  }
}

export const getParkingSlotById = async (
  parkingId: string
): Promise<ParkingSlot> => {
  try {
    const response = await api.get<ApiResponse<ParkingSlot>>(
      `/api/v1/parking/${parkingId}`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch parking slot")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch parking slot"))
  }
}

export const getParkingStats = async (): Promise<ParkingStats> => {
  try {
    const response = await api.get<ApiResponse<ParkingStats>>(
      "/api/v1/parking/stats"
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch parking stats")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch parking stats"))
  }
}

export const updateParkingSlot = async (
  parkingId: string,
  input: UpdateParkingSlotInput
): Promise<ParkingSlot> => {
  try {
    const payload: Record<string, unknown> = {}
    if (input.usageType) payload.usageType = input.usageType

    const response = await api.patch<ApiResponse<ParkingSlot>>(
      `/api/v1/parking/${parkingId}`,
      payload
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update parking slot")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update parking slot"))
  }
}

export const updateParkingSlotStatus = async (
  parkingId: string,
  status: "AVAILABLE" | "INACTIVE"
): Promise<ParkingSlot> => {
  try {
    const response = await api.patch<ApiResponse<ParkingSlot>>(
      `/api/v1/parking/${parkingId}/status`,
      { status }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update status")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update status"))
  }
}

export const assignResidentParking = async (
  parkingId: string,
  input: AssignResidentParkingInput
): Promise<ParkingSlot> => {
  try {
    const payload: Record<string, unknown> = {
      flatId: input.flatId,
    }
    if (input.residentId) payload.residentId = input.residentId
    if (input.vehicleNumber?.trim()) {
      payload.vehicleNumber = input.vehicleNumber.trim().toUpperCase()
    }

    const response = await api.post<ApiResponse<ParkingSlot>>(
      `/api/v1/parking/${parkingId}/assign-resident`,
      payload
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to assign resident")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to assign resident"))
  }
}

export const releaseResidentParking = async (
  parkingId: string
): Promise<ParkingSlot> => {
  try {
    const response = await api.post<ApiResponse<ParkingSlot>>(
      `/api/v1/parking/${parkingId}/release`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to release parking slot")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to release parking slot"))
  }
}
export const generateParkingSlots = async (
  input: GenerateParkingSlotsInput
): Promise<GenerateParkingSlotsResponse> => {
  try {
    const payload = {
      level: input.level.trim(),
      zoneName: input.zoneName?.trim() || null,
      usageType: input.usageType,
      vehicleType: input.vehicleType,
      numberOfSlots: Number(input.numberOfSlots),
    }

    const response = await api.post<ApiResponse<GenerateParkingSlotsResponse>>(
      "/api/v1/parking/generate",
      payload
    )

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to generate parking slots"
      )
    }

    return response.data.data
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to generate parking slots")
    )
  }
}
