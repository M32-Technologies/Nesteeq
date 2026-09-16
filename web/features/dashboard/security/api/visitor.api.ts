import axiosInstance from "@/lib/axios"

import type {
  ActiveVisitorsResponse,
  CheckInVisitorInput,
  ManualVisitorInput,
  VisitorHistoryResponse,
  VisitorPass,
  VisitorRecordsParams,
  VisitorRecordsResponse,
  VisitorVisit,
} from "../schemas/visitor"

export const verifyVisitorPass = async (token: string) => {
  const response = await axiosInstance.post("/api/security/verify-pass", {
    token,
  })

  return response.data.data as VisitorPass
}

export const checkInVisitor = async (
  data: CheckInVisitorInput
) => {
  const response = await axiosInstance.post(
    "/api/visitors/visits/check-in",
    data
  )

  return response.data.data as VisitorVisit
}

export const registerManualVisitor = async (
  data: ManualVisitorInput
) => {
  const response = await axiosInstance.post(
    "/api/visitors/visits/manual",
    data
  )

  return response.data.data as VisitorVisit
}

export const getVisitorRecords = async (
  params: VisitorRecordsParams
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits",
    {
      params,
    }
  )

  return response.data.data as VisitorRecordsResponse
}

export const getActiveVisitors = async (
  page = 1,
  limit = 10
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits/active",
    {
      params: {
        page,
        limit,
      },
    }
  )

  return response.data.data as ActiveVisitorsResponse
}

export const checkoutVisitor = async (visitId: string) => {
  const response = await axiosInstance.patch(
    `/api/visitors/visits/${visitId}/check-out`
  )

  return response.data.data as VisitorVisit
}

export const getVisitorHistory = async (
  page = 1,
  limit = 10
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits/history",
    {
      params: {
        page,
        limit,
      },
    }
  )

  return response.data.data as VisitorHistoryResponse
}
