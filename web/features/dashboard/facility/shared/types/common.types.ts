export const complaintStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const

export const maintenanceStatuses = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const

export const complaintCategories = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "SECURITY",
  "LIFT",
  "WATER",
  "MAINTENANCE",
  "OTHER",
] as const

export const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export const technicianStatuses = [
  "ACTIVE",
  "BUSY",
  "ON_LEAVE",
  "INACTIVE",
] as const

export const maintenanceCostStatuses = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const

export const scheduleStatuses = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
] as const

export const scheduleWorkTypes = ["complaint", "maintenance"] as const

export type ComplaintStatus = (typeof complaintStatuses)[number]
export type MaintenanceStatus = (typeof maintenanceStatuses)[number]
export type ComplaintCategory = (typeof complaintCategories)[number]
export type Priority = (typeof priorities)[number]
export type TechnicianStatus = (typeof technicianStatuses)[number]
export type MaintenanceCostStatus = (typeof maintenanceCostStatuses)[number]
export type ScheduleStatus = (typeof scheduleStatuses)[number]
export type ScheduleWorkType = (typeof scheduleWorkTypes)[number]

export type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type ActivityNote = {
  message: string
  by: string
  role: string
  createdAt: string
}

export type CompletionDetails = {
  details?: string | null
  workNotes?: string | null
  completedBy?: string | null
  completedAt?: string | null
}

export type ApprovalDetails = {
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
}

export type StatusPayload = {
  status: string
  notes?: string
}

export type ReasonPayload = {
  reason?: string
  notes?: string
}

export type RequiredReasonPayload = {
  reason: string
}

export type AssignPayload = {
  assignedTo?: string
  technicianId?: string
  scheduledDate?: string
  estimatedDurationHours?: number
  notes?: string
}
