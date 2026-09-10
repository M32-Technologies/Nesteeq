import axiosInstance from "@/lib/axios"

import type {
  EmergencyAlert,
  EmergencyAlertsResponse,
  EmergencyAlertStatus,
} from "../schemas/alert"

export const getEmergencyAlerts = async (params: {
  status?: EmergencyAlertStatus
  search?: string
  page?: number
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/alerts",
    {
      params,
    }
  )

  return response.data.data as EmergencyAlertsResponse
}

export const updateEmergencyAlertStatus = async ({
  alertId,
  status,
  resolutionNotes,
}: {
  alertId: string
  status: Exclude<EmergencyAlertStatus, "ALL">
  resolutionNotes?: string
}) => {
  const response = await axiosInstance.patch(
    `/api/security/alerts/${alertId}/status`,
    {
      status,
      resolutionNotes,
    }
  )

  return response.data.data as EmergencyAlert
}
