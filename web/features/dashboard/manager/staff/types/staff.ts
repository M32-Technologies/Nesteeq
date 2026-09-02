export type StaffRole =
  | "property_manager"
  | "treasurer"
  | "facility_manager"
  | "security_staff"
  | "maintenance_technician"

export type StaffStatus = "active" | "inactive"

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked"

export type StaffMember = {
  id: string
  apartmentId: string
  userId: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role: StaffRole
  maintenanceType?: string | null
  phone: string
  status: StaffStatus
  joinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type StaffListParams = {
  search?: string
  role?: StaffRole
  status?: StaffStatus
  page?: number
  limit?: number
}

export type StaffListResult = {
  staff: StaffMember[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type StaffStats = {
  totalStaff: number
  activeStaff: number
  pendingInvites: number
  inactiveStaff: number
}

export type StaffInvitation = {
  id: string
  name: string
  email: string
  phone: string
  role: StaffRole
  maintenanceType: string
  status: InvitationStatus
  sentAt: string | null
  expiresAt: string | null
}

export type StaffInvitationListParams = {
  search?: string
  role?: StaffRole
  status?: InvitationStatus
  page?: number
  limit?: number
}

export type StaffInvitationListResult = {
  invitations: StaffInvitation[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type CreateStaffInviteInput = {
  fullName: string
  email: string
  phoneNumber?: string | null
  role: StaffRole
  maintenanceType?: string | null
}

export type UpdateStaffInput = {
  name: string
  phone: string | null
  role: StaffRole
  maintenanceType?: string | null
}

export type ApiStaffMember = {
  _id?: string
  id?: string
  apartmentId?: string
  userId?: string
  name?: string
  email?: string | null
  emailVerified?: boolean
  image?: string | null
  role?: StaffRole
  maintenanceType?: string | null
  phone?: string | null
  status?: StaffStatus
  joinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type ApiStaffInvitation = {
  _id?: string
  id?: string
  fullName?: string
  email?: string
  phoneNumber?: string | null
  role?: StaffRole
  maintenanceType?: string | null
  status?: InvitationStatus
  expiresAt?: string | null
  createdAt?: string | null
}
