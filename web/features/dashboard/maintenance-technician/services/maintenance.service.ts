import { isAxiosError } from "axios"

import api from "@/lib/axios"

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

export type MaintenanceDashboardStats = {
  stats: {
    totalAssigned: number
    pending: number
    inProgress: number
    completed: number
  }
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message || error.response?.data?.error || fallback
    )
  }

  return error instanceof Error ? error.message : fallback
}

export const getMaintenanceDashboardStats =
  async (): Promise<MaintenanceDashboardStats> => {
    try {
      const response = await api.get<
        ApiResponse<MaintenanceDashboardStats>
      >("/api/maintenance-technician/dashboard")

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch dashboard stats"
        )
      }

      return response.data.data
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Failed to fetch dashboard stats")
      )
    }
  }