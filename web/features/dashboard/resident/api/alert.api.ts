import api from "@/lib/axios"

export type ResidentEmergencyAlertType =
  | "SOS"
  | "MEDICAL"
  | "FIRE"
  | "SECURITY"
  | "OTHER"

export interface CreateResidentAlertPayload {
  alertType: ResidentEmergencyAlertType
  message?: string
}

export interface ResidentAlertResponse {
  _id: string
  apartmentId: string
  residentId: string
  flatId: string
  alertType: ResidentEmergencyAlertType
  message?: string | null
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESPONDING" | "RESOLVED"
  triggeredAt: string
}

export const createResidentEmergencyAlert = async (
  payload: CreateResidentAlertPayload
) => {
  const response = await api.post("/api/security/alerts", payload)
  return response.data
}
