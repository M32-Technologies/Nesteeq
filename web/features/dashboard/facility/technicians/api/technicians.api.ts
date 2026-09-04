import api from "@/lib/axios"
import type { ApiResponse } from "../../shared/types/common.types"
import { removeEmptyValues } from "../../shared/utils/facility-error"
import type {
  CreateTechnicianPayload,
  FacilityTechnicianStats,
  Technician,
  TechnicianQuery,
  TechniciansListData,
  UpdateTechnicianPayload,
} from "../types/technicians.types"

const TECHNICIANS_PATH = "/api/v1/technicians"

export async function fetchTechnicians(query: TechnicianQuery = {}) {
  const response = await api.get<ApiResponse<TechniciansListData>>(
    TECHNICIANS_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load technicians")
  }

  return response.data.data
}

export async function fetchTechnicianById(id: string) {
  const response = await api.get<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load technician")
  }

  return response.data.data
}

export async function createTechnician(payload: CreateTechnicianPayload) {
  const response = await api.post<ApiResponse<Technician>>(
    TECHNICIANS_PATH,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to create technician")
  }

  return response.data.data
}

export async function updateTechnician(
  id: string,
  payload: UpdateTechnicianPayload
) {
  const response = await api.patch<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update technician")
  }

  return response.data.data
}

export async function updateTechnicianStatus(
  id: string,
  status: string
) {
  const response = await api.patch<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}/status`,
    { status }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update technician status")
  }

  return response.data.data
}

export async function fetchTechnicianTasks(id: string) {
  const response = await api.get<ApiResponse<unknown>>(
    `${TECHNICIANS_PATH}/${id}/tasks`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load technician tasks")
  }

  return response.data.data
}

export async function assignTechnicianWork(
  id: string,
  payload: { workType: string; workId: string }
) {
  const response = await api.post<ApiResponse<unknown>>(
    `${TECHNICIANS_PATH}/${id}/assign`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to assign work to technician")
  }

  return response.data.data
}

export async function updateTechnicianTaskStatus(
  id: string,
  taskId: string,
  status: string
) {
  const response = await api.patch<ApiResponse<unknown>>(
    `${TECHNICIANS_PATH}/${id}/tasks/${taskId}`,
    { status }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update task status")
  }

  return response.data.data
}

async function countTechnicians(status?: string): Promise<number> {
  const data = await fetchTechnicians({ status, page: 1, limit: 1 })
  return data.pagination.total
}

export async function fetchTechnicianStats(): Promise<FacilityTechnicianStats> {
  const [total, active, busy, onLeave, inactive] = await Promise.all([
    countTechnicians(),
    countTechnicians("ACTIVE"),
    countTechnicians("BUSY"),
    countTechnicians("ON_LEAVE"),
    countTechnicians("INACTIVE"),
  ])

  return {
    total,
    active,
    busy,
    onLeave,
    inactive,
  }
}
