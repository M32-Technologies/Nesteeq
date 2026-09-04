import {
  maintenanceCostStatuses,
  maintenanceStatuses,
  priorities,
  type ActivityNote,
  type ApprovalDetails,
  type CompletionDetails,
  type MaintenanceCostStatus,
  type MaintenanceStatus,
  type Pagination,
  type Priority,
} from "@/features/dashboard/facility/shared/types/common.types"

export { maintenanceCostStatuses, maintenanceStatuses, priorities }
export type {
  MaintenanceCostStatus,
  MaintenanceStatus,
  Priority,
} from "@/features/dashboard/facility/shared/types/common.types"

export type Maintenance = {
  _id: string
  title: string
  description?: string
  category: string
  priority: Priority
  status: MaintenanceStatus
  costStatus?: MaintenanceCostStatus
  apartmentId?: string
  buildingId?: string
  flatId?: string
  complaintId?: string
  assignedTo?: {
    _id: string
    name: string
    role?: string
  } | string
  estimatedCost?: number
  finalCost?: number
  scheduledDate?: string
  estimatedDurationHours?: number
  workNotes?: string
  activityNotes?: ActivityNote[]
  completionDetails?: CompletionDetails
  approvalDetails?: ApprovalDetails
  createdAt: string
  updatedAt: string
}

export type MaintenanceQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  category?: string
  buildingId?: string
  assignedTo?: string
}

export type MaintenanceListData = {
  maintenance: Maintenance[]
  pagination: Pagination
}

export type MaintenanceUpdatePayload = {
  title?: string
  description?: string
  category?: string
  priority?: Priority
  status?: MaintenanceStatus
  assignedTo?: string
  estimatedCost?: number
  scheduledDate?: string
  estimatedDurationHours?: number
}

export type MaintenanceProgressPayload = {
  status: MaintenanceStatus
  notes?: string
}

export type CreateMaintenancePayload = {
  title: string
  description?: string
  category?: string
  priority?: Priority
  assignedTo?: string
  complaintId?: string
  estimatedCost?: number
  scheduledDate?: string
  estimatedDurationHours?: number
}

export type FacilityMaintenanceStats = {
  total: number
  pending: number
  assigned: number
  inProgress: number
  completed: number
}
