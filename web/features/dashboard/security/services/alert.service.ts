import axiosInstance from "@/lib/axios"

import type { VisitorPagination } from "./visitor.service"

export type EmergencyAlertStatus =
  | "ALL"
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "RESPONDING"
  | "RESOLVED"

export type EmergencyAlertType =
  | "SOS"
  | "MEDICAL"
  | "FIRE"
  | "SECURITY"
  | "OTHER"

export interface EmergencyAlert {
  _id: string
  apartmentId: string
  residentId: string
  residentName: string | null
  residentPhone: string | null
  flatId: string
  flatNumber: string | null
  alertType: EmergencyAlertType
  message?: string | null
  status: Exclude<EmergencyAlertStatus, "ALL">
  triggeredBy: string
  triggeredAt: string
  acknowledgedBy?: string | null
  acknowledgedAt?: string | null
  respondingBy?: string | null
  respondingAt?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  resolutionNotes?: string | null
}

export interface EmergencyAlertsResponse {
  alerts: EmergencyAlert[]
  pagination: VisitorPagination
}

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
