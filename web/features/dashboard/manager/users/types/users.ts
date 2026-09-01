export type ResidentType = "owner" | "resident"

export type ResidentStatus = "active" | "pending" | "inactive"

export type ResidentUser = {
  id: string
  name: string
  email: string
  phone: string
  type: ResidentType
  blockId: string
  block: string
  flat: string
  status: ResidentStatus
}

export type ResidentListParams = {
  search?: string
  residentType?: ResidentType
  blockId?: string
  status?: ResidentStatus
  page?: number
  limit?: number
}

export type ResidentListResult = {
  residents: ResidentUser[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type ResidentDetails = ResidentUser & {
  apartmentId: string
  userId?: string | null
  image?: string | null
  emailVerified: boolean
  joinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type UpdateResidentInput = {
  name: string
  phone: string | null
  residentType: ResidentType
}

export type UserStats = {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  inactiveUsers: number
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked"

export type InvitationRole =
  | ResidentType
  | "property_manager"
  | "treasurer"
  | "facility_manager"
  | "security_staff"
  | "maintenance_technician"

export type InvitationMember = {
  id: string
  name: string
  email: string
  phone: string
  role: InvitationRole
  status: InvitationStatus
  flat: string
  maintenanceType: string
  sentAt: string | null
  expiresAt: string | null
}

export type InvitationListParams = {
  search?: string
  role?: InvitationRole
  inviteType?: "residents"
  status?: InvitationStatus
  page?: number
  limit?: number
}

export type InvitationListResult = {
  invitations: InvitationMember[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type CreateResidentInviteInput = {
  fullName: string
  email: string
  phoneNumber?: string | null
  flatId: string
  role: ResidentType
}

export type BlockOption = {
  id: string
  name: string
}

export type FlatOption = {
  id: string
  blockId: string
  block?: {
    id: string
    blockname: string
    code: string
  }
  residentId?: string | null
  floorNumber?: number
  flatNumber: string
  occupancyStatus: "VACANT" | "OWNER" | "TENANT"
  status?: "active" | "inactive"
}

export type FlatListParams = {
  search?: string
  blockId?: string
  floorNumber?: string | number
  occupancyStatus?: FlatOption["occupancyStatus"]
  status?: "active" | "inactive"
  page?: number
  limit?: number
  sortBy?:
    | "flatNumber"
    | "floorNumber"
    | "occupancyStatus"
    | "status"
    | "createdAt"
    | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export type BulkInviteRowResult = {
  row: number
  email: string
  status: "created" | "skipped" | "failed"
  reason?: string
}

export type BulkInviteResult = {
  total: number
  created: number
  skipped: number
  failed: number
  results: BulkInviteRowResult[]
}

export type ApiResidentFlat = {
  _id?: string
  flatNumber?: string
  blockId?:
    | string
    | {
        _id?: string
        blockname?: string
        name?: string
      }
}

export type ApiResident = {
  _id?: string
  id?: string
  apartmentId?: string
  userId?: string
  name?: string
  email?: string | null
  emailVerified?: boolean
  image?: string | null
  phone?: string | null
  phoneNumber?: string | null
  role?: string
  residentType?: ResidentType
  type?: ResidentType
  status?: ResidentStatus
  flat?: string | ApiResidentFlat
  flatId?: string | ApiResidentFlat
  joinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  user?: {
    name?: string
    email?: string
  }
}

export type ApiInvitationFlat = {
  _id?: string
  flatNumber?: string
}

export type ApiInvitation = {
  _id?: string
  id?: string
  email?: string
  fullName?: string
  phoneNumber?: string | null
  role?: InvitationRole
  status?: InvitationStatus
  flatId?: string | ApiInvitationFlat | null
  maintenanceType?: string | null
  expiresAt?: string | null
  createdAt?: string | null
}
