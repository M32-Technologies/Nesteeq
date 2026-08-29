import api from "@/lib/axios"

import type {
  ApiInvitation,  
  ApiResident,
  ApiResidentFlat,
  BlockOption,
  BulkInviteResult,
  CreateResidentInviteInput,
  FlatOption,
  InvitationListParams,
  InvitationListResult,
  InvitationMember,
  InvitationStatus,
  ResidentDetails,
  ResidentListParams,
  ResidentListResult,
  ResidentUser,
  ResidentStatus,
  UpdateResidentInput,
  UserStats,
} from "../types/users"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ResidentListApiData = {
  residents: ApiResident[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

type InvitationListApiData = {
  invitations: ApiInvitation[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

type BlocksApiData = {
  blocks: BlockOption[]
}

type FlatsApiData = {
  flats: FlatOption[]
}

export const getResidents = async (
  params: ResidentListParams = {}
): Promise<ResidentListResult> => {
  const response = await api.get<ApiResponse<ResidentListApiData>>(
    "/api/v1/residents",
    {
      params: cleanResidentParams(params),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch residents")
  }

  return {
    ...response.data.data,
    residents: response.data.data.residents.map(mapResident),
  }
}

export const getUserStats = async (): Promise<UserStats> => {
  const [
    allUsers,
    activeUsers,
    pendingInvitations,
    inactiveUsers,
  ] = await Promise.all([
    getResidents({ page: 1, limit: 1 }),
    getResidents({ status: "active", page: 1, limit: 1 }),
    getInvitations({
      inviteType: "residents",
      status: "pending",
      page: 1,
      limit: 1,
    }),
    getResidents({ status: "inactive", page: 1, limit: 1 }),
  ])

  return {
    totalUsers: allUsers.totalCount,
    activeUsers: activeUsers.totalCount,
    pendingUsers: pendingInvitations.totalCount,
    inactiveUsers: inactiveUsers.totalCount,
  }
}

export const getInvitations = async (
  params: InvitationListParams = {}
): Promise<InvitationListResult> => {
  const response = await api.get<ApiResponse<InvitationListApiData>>(
    "/api/v1/invitations",
    {
      params: cleanInvitationParams(params),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch invitations")
  }

  return {
    ...response.data.data,
    totalPages: Math.max(1, response.data.data.totalPages),
    invitations: response.data.data.invitations.map(mapInvitation),
  }
}

export const resendInvitation = async (
  invitationId: string
): Promise<{ id: string; status: InvitationStatus; expiresAt: string | null }> => {
  const response = await api.post<
    ApiResponse<{ id: string; status: InvitationStatus; expiresAt?: string | null }>
  >(`/api/v1/invitations/${invitationId}/resend`)

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to resend invitation")
  }

  return {
    id: response.data.data.id,
    status: response.data.data.status,
    expiresAt: response.data.data.expiresAt ?? null,
  }
}

export const revokeInvitation = async (
  invitationId: string
): Promise<{ id: string; status: InvitationStatus; revokedAt?: string | null }> => {
  const response = await api.patch<
    ApiResponse<{ id: string; status: InvitationStatus; revokedAt?: string | null }>
  >(`/api/v1/invitations/${invitationId}/revoke`)

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to revoke invitation")
  }

  return response.data.data
}

export const createResidentInvitation = async (
  input: CreateResidentInviteInput
): Promise<InvitationMember> => {
  const response = await api.post<ApiResponse<ApiInvitation>>(
    "/api/v1/invitations/residents",
    {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phoneNumber: input.phoneNumber?.trim() || null,
      flatId: input.flatId,
      role: input.role,
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to send invitation")
  }

  return mapInvitation(response.data.data)
}

export const bulkCreateResidentInvitations = async (
  file: File
): Promise<BulkInviteResult> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post<ApiResponse<BulkInviteResult>>(
    "/api/v1/invitations/residents/bulk-invite",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to upload invitations")
  }

  return response.data.data
}

export const downloadResidentInviteTemplate = async () => {
  const response = await api.get<Blob>(
    "/api/v1/invitations/residents/template",
    {
      responseType: "blob",
    }
  )

  return response.data
}

export const getBlocks = async (): Promise<BlockOption[]> => {
  const response = await api.get<ApiResponse<BlocksApiData>>("/api/v1/blocks")

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch blocks")
  }

  return response.data.data.blocks
}

export const getFlats = async (blockId?: string): Promise<FlatOption[]> => {
  const response = await api.get<ApiResponse<FlatsApiData>>("/api/v1/flats", {
    params: {
      blockId,
    },
  })

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch flats")
  }

  return response.data.data.flats
}

export const getResidentDetails = async (
  residentId: string
): Promise<ResidentDetails> => {
  const response = await api.get<ApiResponse<ApiResident>>(
    `/api/v1/residents/${residentId}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch resident")
  }

  return mapResidentDetails(response.data.data)
}

export const updateResidentDetails = async (
  residentId: string,
  input: UpdateResidentInput
): Promise<ResidentDetails> => {
  const response = await api.patch<ApiResponse<ApiResident>>(
    `/api/v1/residents/${residentId}`,
    {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      residentType: input.residentType,
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update resident")
  }

  return mapResidentDetails(response.data.data)
}

export const updateResidentStatus = async (
  residentId: string,
  status: ResidentStatus
): Promise<{ id: string; status: ResidentStatus }> => {
  const response = await api.patch<ApiResponse<{ id: string; status: ResidentStatus }>>(
    `/api/v1/residents/${residentId}/status`,
    { status }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update status")
  }

  return response.data.data
}

const cleanResidentParams = (params: ResidentListParams) => ({
  search: params.search?.trim() || undefined,
  residentType: params.residentType,
  blockId: params.blockId,
  status: params.status,
  page: params.page,
  limit: params.limit,
})

const cleanInvitationParams = (params: InvitationListParams) => ({
  search: params.search?.trim() || undefined,
  role: params.role,
  inviteType: params.inviteType,
  status: params.status,
  page: params.page,
  limit: params.limit,
})

const mapResident = (resident: ApiResident): ResidentUser => {
  const flat = getResidentFlat(resident)
  const block = getBlock(flat)

  return {
    id: resident.id || resident._id || resident.userId || "-",
    name: resident.user?.name || resident.name || "Unknown user",
    email: resident.user?.email || resident.email || "-",
    phone: resident.phone || resident.phoneNumber || "-",
    type: resident.residentType || resident.type || "resident",
    blockId: block.id,
    block: block.name,
    flat: flat?.flatNumber || "-",
    status: resident.status || "pending",
  }
}

const mapResidentDetails = (resident: ApiResident): ResidentDetails => {
  const row = mapResident(resident)

  return {
    ...row,
    apartmentId: resident.apartmentId || "-",
    userId: resident.userId ?? null,
    image: resident.image ?? null,
    emailVerified: resident.emailVerified ?? false,
    joinedAt: resident.joinedAt ?? null,
    createdAt: resident.createdAt ?? null,
    updatedAt: resident.updatedAt ?? null,
  }
}

const mapInvitation = (invitation: ApiInvitation): InvitationMember => {
  const flat = getInvitationFlat(invitation)

  return {
    id: invitation.id || invitation._id || "-",
    name: invitation.fullName || "Unknown invitee",
    email: invitation.email || "-",
    phone: invitation.phoneNumber || "-",
    role: invitation.role || "resident",
    status: invitation.status || "pending",
    flat,
    maintenanceType: invitation.maintenanceType || "-",
    sentAt: invitation.createdAt ?? null,
    expiresAt: invitation.expiresAt ?? null,
  }
}

const getResidentFlat = (resident: ApiResident): ApiResidentFlat | undefined => {
  const flat = resident.flat || resident.flatId

  return typeof flat === "object" && flat ? flat : undefined
}

const getBlock = (flat?: ApiResidentFlat) => {
  if (!flat?.blockId) {
    return {
      id: "",
      name: "-",
    }
  }

  if (typeof flat.blockId === "string") {
    return {
      id: flat.blockId,
      name: flat.blockId,
    }
  }

  return {
    id: flat.blockId._id || "",
    name: flat.blockId.blockname || flat.blockId.name || flat.blockId._id || "-",
  }
}

const getInvitationFlat = (invitation: ApiInvitation) => {
  if (!invitation.flatId) return "-"

  if (typeof invitation.flatId === "string") {
    return invitation.flatId
  }

  return invitation.flatId.flatNumber || invitation.flatId._id || "-"
}
