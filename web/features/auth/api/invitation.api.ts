import api from "@/lib/axios"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type ResolvedInvite = {
  id: string
  email: string
  fullName: string
  role: string
  maintenanceType?: string | null
  apartment: {
    id: string
  }
  flat: {
    id: string
    flatNumber: string
  } | null
  expiresAt: string
}

export type AcceptedInvite = {
  role: string
  apartmentId: string
  flatId?: string | null
  status: "accepted"
}

export const resolveInvite = async (token: string) => {
  const response = await api.get<ApiResponse<ResolvedInvite>>(
    `/api/v1/invitations/validate/${encodeURIComponent(token)}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to validate invite")
  }

  return response.data.data
}

export const acceptInvite = async (token: string) => {
  const response = await api.post<ApiResponse<AcceptedInvite>>(
    `/api/v1/invitations/${encodeURIComponent(token)}/accept`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to accept invite")
  }

  return response.data.data
}
