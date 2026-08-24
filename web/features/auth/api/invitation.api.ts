import api from "@/lib/axios"

export type InviteDetails = {
  email: string
  fullName?: string
  role?: string
  apartmentName?: string
}

export type AcceptInviteResult = {
  role?: string
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export const resolveInvite = async (
  token: string,
): Promise<InviteDetails> => {
  const response = await api.get<ApiResponse<InviteDetails> | InviteDetails>(
    "/api/v1/invitations/resolve",
    {
      params: { token },
    },
  )

  return unwrapApiData(response.data)
}

export const acceptInvite = async (
  token: string,
): Promise<AcceptInviteResult> => {
  const response = await api.post<
    ApiResponse<AcceptInviteResult> | AcceptInviteResult
  >("/api/v1/invitations/accept", { token })

  return unwrapApiData(response.data)
}

const unwrapApiData = <T>(response: ApiResponse<T> | T): T => {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return response.data as T
  }

  return response as T
}
