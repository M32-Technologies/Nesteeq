import type { VisitorPagination } from "./visitor"

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
