import axiosInstance from "@/lib/axios"

import type {
  SecurityActivityResponse,
  SecurityFlat,
  SecurityResidentsResponse,
  SecuritySummary,
} from "./security.interface"

export type {
  SecurityActivity,
  SecurityActivityResponse,
  SecurityActivityType,
  SecurityFlat,
  SecurityResidentDirectoryRecord,
  SecurityResidentSummary,
  SecurityResidentsResponse,
  SecuritySummary,
} from "./security.interface"

export const getSecuritySummary = async () => {
  const response = await axiosInstance.get(
    "/api/security/summary"
  )

  return response.data.data as SecuritySummary
}

export const getSecurityActivity = async (params?: {
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/activity",
    {
      params,
    }
  )

  return response.data.data as SecurityActivityResponse
}

export const getSecurityFlats = async () => {
  const response = await axiosInstance.get(
    "/api/security/flats"
  )

  return response.data.data as { flats: SecurityFlat[] }
}

export const getSecurityResidents = async (params: {
  search?: string
  page?: number
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/residents",
    {
      params,
    }
  )

  return response.data.data as SecurityResidentsResponse
}
