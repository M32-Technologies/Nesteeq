export type BetterAuthUser = {
  id: string
  name: string
  email: string
  role?: string | null
  image?: string | null
  emailVerified: boolean
  createdAt: string | Date
  banned?: boolean
  banReason?: string | null
  banExpires?: string | number | Date | null
  phone?: string | null
  apartmentId?: string | null
  flatId?: string | null
}

export type UserKpiStats = {
  totalUsers: number // Excluding admin and super_admin
  propertyManagers: number
  residents: number
  inactiveUsers: number // !emailVerified or banned
  verifiedManagers: number
  totalBanned: number
}

export type UserRoleFilter = "all" | "property_manager" | "resident"

export type ManagerFilterStatus = "all" | "active" | "inactive" | "banned"
