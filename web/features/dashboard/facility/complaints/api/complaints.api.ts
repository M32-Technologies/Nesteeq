import api from "@/lib/axios"
import type {
  ApiResponse,
  AssignPayload,
  ReasonPayload,
  RequiredReasonPayload,
  StatusPayload,
} from "../../shared/types/common.types"
import { removeEmptyValues } from "../../shared/utils/facility-error"
import type {
  Complaint,
  ComplaintQuery,
  ComplaintsListData,
  ComplaintUpdatePayload,
  FacilityComplaintStats,
} from "../types/complaints.types"

const COMPLAINTS_PATH = "/api/v1/complaints"
const MAINTENANCE_PATH = "/api/v1/maintenance"

export async function fetchComplaints(query: ComplaintQuery = {}) {
  const response = await api.get<ApiResponse<ComplaintsListData>>(
    COMPLAINTS_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load complaints")
  }

  return response.data.data
}

export async function fetchComplaintById(id: string) {
  const response = await api.get<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load complaint")
  }

  return response.data.data
}

export async function assignComplaint(id: string, payload: AssignPayload) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/assign`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to assign complaint")
  }

  return response.data.data
}

export async function updateComplaintStatus(id: string, payload: StatusPayload) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/status`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update complaint status")
  }

  return response.data.data
}

export async function updateComplaint(
  id: string,
  payload: ComplaintUpdatePayload
) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update complaint")
  }

  return response.data.data
}

export async function cancelComplaint(id: string, payload: ReasonPayload = {}) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/cancel`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to cancel complaint")
  }

  return response.data.data
}

export async function rejectComplaint(
  id: string,
  payload: RequiredReasonPayload
) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/reject`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to reject complaint")
  }

  return response.data.data
}

export async function approveComplaint(id: string, payload: ReasonPayload = {}) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/approve`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to approve complaint")
  }

  return response.data.data
}

export async function createMaintenance(payload: {
  title: string
  description?: string
  priority?: string
  assignedTo?: string
  complaintId?: string
  scheduledDate?: string
  estimatedDurationHours?: number
}) {
  const response = await api.post<ApiResponse<unknown>>(
    MAINTENANCE_PATH,
    payload
  )

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to create maintenance from complaint"
    )
  }

  return response.data.data
}

async function countComplaints(status?: string): Promise<number> {
  const data = await fetchComplaints({ status, page: 1, limit: 1 })
  return data.pagination.total
}

export async function fetchComplaintStats(): Promise<FacilityComplaintStats> {
  const [
    total,
    pending,
    assigned,
    inProgress,
    workCompleted,
    awaitingApproval,
    approved,
    closed,
  ] = await Promise.all([
    countComplaints(),
    countComplaints("PENDING"),
    countComplaints("ASSIGNED"),
    countComplaints("IN_PROGRESS"),
    countComplaints("WORK_COMPLETED"),
    countComplaints("AWAITING_APPROVAL"),
    countComplaints("APPROVED"),
    countComplaints("CLOSED"),
  ])

  return {
    total,
    pending,
    assigned,
    inProgress,
    resolved: approved + closed,
    awaitingApproval: workCompleted + awaitingApproval,
  }
}
