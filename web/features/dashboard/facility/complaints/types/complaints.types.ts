import {
  complaintCategories,
  complaintStatuses,
  priorities,
  type ActivityNote,
  type ApprovalDetails,
  type ComplaintCategory,
  type ComplaintStatus,
  type CompletionDetails,
  type Pagination,
  type Priority,
} from "@/features/dashboard/facility/shared/types/common.types"

export { complaintCategories, complaintStatuses, priorities }
export type {
  ComplaintCategory,
  ComplaintStatus,
  Priority,
} from "@/features/dashboard/facility/shared/types/common.types"

export type Complaint = {
  _id: string
  title: string
  description?: string
  category: ComplaintCategory
  priority: Priority
  status: ComplaintStatus
  apartmentId?: string
  buildingId?: string
  flatId?: string
  residentId?: {
    _id: string
    name: string
    email?: string
    phone?: string
  } | string
  assignedTo?: {
    _id: string
    name: string
    role?: string
  } | string
  maintenanceId?: string
  attachments?: string[]
  rejectionReason?: string
  activityNotes?: ActivityNote[]
  completionDetails?: CompletionDetails
  approvalDetails?: ApprovalDetails
  createdAt: string
  updatedAt: string
}

export type ComplaintQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  category?: string
  buildingId?: string
  residentId?: string
  assignedTo?: string
}

export type ComplaintsListData = {
  complaints: Complaint[]
  pagination: Pagination
}

export type ComplaintUpdatePayload = {
  title?: string
  description?: string
  category?: ComplaintCategory
  priority?: Priority
  status?: ComplaintStatus
  assignedTo?: string
}

export type FacilityComplaintStats = {
  total: number
  pending: number
  assigned: number
  inProgress: number
  resolved: number
  awaitingApproval: number
}
