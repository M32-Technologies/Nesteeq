import type {
  Pagination,
  ScheduleStatus,
  ScheduleWorkType,
} from "@/features/dashboard/facility/shared/types/common.types"

export type { ScheduleStatus, ScheduleWorkType } from "@/features/dashboard/facility/shared/types/common.types"

export type Schedule = {
  _id: string
  title: string
  description?: string
  workType: ScheduleWorkType
  status: ScheduleStatus
  assignedTo?: {
    _id: string
    name: string
    role?: string
  } | string
  complaintId?: string
  maintenanceId?: string
  scheduledDate: string
  estimatedDurationHours?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ScheduleQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
  workType?: string
  assignedTo?: string
}

export type ScheduleListData = {
  schedules: Schedule[]
  pagination: Pagination
  summary: FacilityScheduleStats
}

export type CreateSchedulePayload = {
  title: string
  description?: string
  workType: ScheduleWorkType
  assignedTo?: string
  complaintId?: string
  maintenanceId?: string
  scheduledDate: string
  estimatedDurationHours?: number
  notes?: string
}

export type UpdateSchedulePayload = {
  title?: string
  description?: string
  status?: ScheduleStatus
  assignedTo?: string
  scheduledDate?: string
  estimatedDurationHours?: number
  notes?: string
}

export type FacilityScheduleStats = {
  total: number
  scheduled: number
  inProgress: number
  completed: number
  cancelled: number
  rescheduled: number
}
