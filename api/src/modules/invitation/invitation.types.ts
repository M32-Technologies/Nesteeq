import { Types } from "mongoose"
import { STAFF_ROLES } from "../staff/staff.model.js"

export const RESIDENT_INVITE_ROLES = ["owner", "resident"] as const

export const STAFF_INVITE_ROLES = STAFF_ROLES

export const INVITE_ROLES = [
  ...STAFF_INVITE_ROLES,
  ...RESIDENT_INVITE_ROLES,
] as const

export const INVITE_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "revoked",
] as const

export const INVITE_MANAGEMENT_ROLES = [
  "property_manager",
  "treasurer",
  "facility_manager",
] as const

export type ResidentInviteRole = (typeof RESIDENT_INVITE_ROLES)[number]
export type StaffInviteRole = (typeof STAFF_INVITE_ROLES)[number]
export type InviteRole = (typeof INVITE_ROLES)[number]
export type InviteStatus = (typeof INVITE_STATUSES)[number]
export type InviteManagementRole = (typeof INVITE_MANAGEMENT_ROLES)[number]

export type InvitationFilter = {
  apartmentId: Types.ObjectId
  status?: InviteStatus
  role?: InviteRole | { $in: InviteRole[] }
  expiresAt?: { $gt?: Date; $lte?: Date }
  $or?: Array<Record<string, unknown>>
  $and?: Array<Record<string, unknown>>
}

export type AcceptInvitationUser = {
  id: string
  email: string
  emailVerified?: boolean | null
}
