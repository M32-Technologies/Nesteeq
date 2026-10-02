import api from "@/lib/axios"

import type {
  ApiStaffInvitation,
  ApiStaffMember,
  CreateStaffInviteInput,
  InvitationStatus,
  StaffInvitation,
  StaffInvitationListParams,
  StaffInvitationListResult,
  StaffListParams,
  StaffListResult,
  StaffMember,
  StaffRole,
  StaffStats,
  StaffStatus,
  UpdateStaffInput,
} from "../types/staff"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type StaffListApiData = {
  staff: ApiStaffMember[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

type InvitationListApiData = {
  invitations: ApiStaffInvitation[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export const getStaff = async (
  params: StaffListParams = {}
): Promise<StaffListResult> => {
  const response = await api.get<ApiResponse<StaffListApiData>>(
    "/api/v1/staff",
    {
      params: cleanStaffParams(params),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch staff")
  }

  return {
    ...response.data.data,
    totalPages: Math.max(1, response.data.data.totalPages),
    staff: response.data.data.staff.map(mapStaffMember),
  }
}

export const getStaffDetails = async (
  staffId: string
): Promise<StaffMember> => {
  const response = await api.get<ApiResponse<ApiStaffMember>>(
    `/api/v1/staff/${staffId}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch staff member")
  }

  return mapStaffMember(response.data.data)
}

export const updateStaffDetails = async (
  staffId: string,
  input: UpdateStaffInput
): Promise<StaffMember> => {
  const response = await api.patch<ApiResponse<ApiStaffMember>>(
    `/api/v1/staff/${staffId}`,
    {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      role: input.role,
      maintenanceType:
        input.role === "maintenance_technician"
          ? input.maintenanceType?.trim() || null
          : null,
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update staff member")
  }

  return mapStaffMember(response.data.data)
}

export const updateStaffStatus = async (
  staffId: string,
  status: StaffStatus
): Promise<{ id: string; status: StaffStatus }> => {
  const response = await api.patch<ApiResponse<{ id: string; status: StaffStatus }>>(
    `/api/v1/staff/${staffId}/status`,
    { status }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update staff status")
  }

  return response.data.data
}

export const getStaffInvitations = async (
  params: StaffInvitationListParams = {}
): Promise<StaffInvitationListResult> => {
  const response = await api.get<ApiResponse<InvitationListApiData>>(
    "/api/v1/invitations",
    {
      params: {
        ...cleanInvitationParams(params),
        inviteType: "staff",
      },
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch staff invitations")
  }

  return {
    ...response.data.data,
    totalPages: Math.max(1, response.data.data.totalPages),
    invitations: response.data.data.invitations.map(mapStaffInvitation),
  }
}

export const createStaffInvitation = async (
  input: CreateStaffInviteInput
): Promise<StaffInvitation> => {
  const response = await api.post<ApiResponse<ApiStaffInvitation>>(
    "/api/v1/invitations/staff",
    {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phoneNumber: input.phoneNumber?.trim() || null,
      role: input.role,
      maintenanceType:
        input.role === "maintenance_technician"
          ? input.maintenanceType?.trim() || null
          : null,
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to send staff invitation")
  }

  return mapStaffInvitation(response.data.data)
}

export const resendStaffInvitation = async (
  invitationId: string
): Promise<{ id: string; status: InvitationStatus; expiresAt?: string | null }> => {
  const response = await api.post<
    ApiResponse<{ id: string; status: InvitationStatus; expiresAt?: string | null }>
  >(`/api/v1/invitations/${invitationId}/resend`)

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to resend invitation")
  }

  return response.data.data
}

export const revokeStaffInvitation = async (
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

export const getStaffStats = async (): Promise<StaffStats> => {
  const [allStaff, activeStaff, inactiveStaff, pendingInvites] =
    await Promise.all([
      getStaff({ page: 1, limit: 1 }),
      getStaff({ status: "active", page: 1, limit: 1 }),
      getStaff({ status: "inactive", page: 1, limit: 1 }),
      getStaffInvitations({ status: "pending", page: 1, limit: 1 }),
    ])

  return {
    totalStaff: allStaff.totalCount,
    activeStaff: activeStaff.totalCount,
    inactiveStaff: inactiveStaff.totalCount,
    pendingInvites: pendingInvites.totalCount,
  }
}

const cleanStaffParams = (params: StaffListParams) => ({
  search: params.search?.trim() || undefined,
  role: params.role,
  status: params.status,
  page: params.page,
  limit: params.limit,
})

const cleanInvitationParams = (params: StaffInvitationListParams) => ({
  search: params.search?.trim() || undefined,
  role: params.role,
  status: params.status,
  page: params.page,
  limit: params.limit,
})

const mapStaffMember = (member: ApiStaffMember): StaffMember => ({
  id: member.id || member._id || "-",
  apartmentId: member.apartmentId || "-",
  userId: member.userId || "-",
  name: member.name || "Unknown user",
  email: member.email || "-",
  emailVerified: member.emailVerified ?? false,
  image: member.image ?? null,
  role: member.role || "security_staff",
  maintenanceType: member.maintenanceType ?? null,
  phone: member.phone || "-",
  status: member.status || "inactive",
  joinedAt: member.joinedAt ?? null,
  createdAt: member.createdAt ?? null,
  updatedAt: member.updatedAt ?? null,
})

const mapStaffInvitation = (
  invitation: ApiStaffInvitation
): StaffInvitation => ({
  id: invitation.id || invitation._id || "-",
  name: invitation.fullName || "Unknown invitee",
  email: invitation.email || "-",
  phone: invitation.phoneNumber || "-",
  role: invitation.role || "security_staff",
  maintenanceType: invitation.maintenanceType || "-",
  status: invitation.status || "pending",
  sentAt: invitation.createdAt ?? null,
  expiresAt: invitation.expiresAt ?? null,
})

export const staffRoleOptions: { label: string; value: StaffRole }[] = [
  { label: "Property Manager", value: "property_manager" },
  { label: "Treasurer", value: "treasurer" },
  { label: "Facility Manager", value: "facility_manager" },
  { label: "Security Staff", value: "security_staff" },
  { label: "Maintenance Technician", value: "maintenance_technician" },
]

