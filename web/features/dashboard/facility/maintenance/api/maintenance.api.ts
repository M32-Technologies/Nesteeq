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
  FacilityMaintenanceStats,
  Maintenance,
  MaintenanceListData,
  MaintenanceQuery,
  MaintenanceUpdatePayload,
} from "../types/maintenance.types"

const MAINTENANCE_PATH = "/api/v1/maintenance"

export async function fetchMaintenance(query: MaintenanceQuery = {}) {
  const response = await api.get<ApiResponse<MaintenanceListData>>(
    MAINTENANCE_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load maintenance")
  }

  return response.data.data
}

export async function fetchMaintenanceById(id: string) {
  const response = await api.get<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load maintenance item")
  }

  return response.data.data
}

export async function assignMaintenance(id: string, payload: AssignPayload) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/assign`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to assign maintenance")
  }

  return response.data.data
}

export async function updateMaintenanceStatus(
  id: string,
  payload: StatusPayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/status`,
    payload
  )

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to update maintenance status"
    )
  }

  return response.data.data
}

export async function updateMaintenance(
  id: string,
  payload: MaintenanceUpdatePayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update maintenance")
  }

  return response.data.data
}

export async function cancelMaintenance(
  id: string,
  payload: ReasonPayload = {}
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cancel`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to cancel maintenance")
  }

  return response.data.data
}

export async function rejectMaintenance(
  id: string,
  payload: RequiredReasonPayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/reject`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to reject maintenance")
  }

  return response.data.data
}

export async function approveMaintenance(
  id: string,
  payload: ReasonPayload = {}
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/approve`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to approve maintenance")
  }

  return response.data.data
}

export async function closeMaintenance(id: string, payload: ReasonPayload = {}) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/close`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to close maintenance")
  }

  return response.data.data
}

export async function approveMaintenanceCost(
  id: string,
  payload: ReasonPayload = {}
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cost/approve`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to approve cost")
  }

  return response.data.data
}

export async function rejectMaintenanceCost(
  id: string,
  payload: RequiredReasonPayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cost/reject`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to reject cost")
  }

  return response.data.data
}

async function countMaintenance(status?: string): Promise<number> {
  const data = await fetchMaintenance({ status, page: 1, limit: 1 })
  return data.pagination.total
}

export async function fetchMaintenanceStats(): Promise<FacilityMaintenanceStats> {
  const [total, pending, assigned, inProgress, workCompleted, approved, closed] =
    await Promise.all([
      countMaintenance(),
      countMaintenance("PENDING"),
      countMaintenance("ASSIGNED"),
      countMaintenance("IN_PROGRESS"),
      countMaintenance("WORK_COMPLETED"),
      countMaintenance("APPROVED"),
      countMaintenance("CLOSED"),
    ])

  return {
    total,
    pending,
    assigned,
    inProgress,
    completed: workCompleted + approved + closed,
  }
}
