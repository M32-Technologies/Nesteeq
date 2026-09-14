import api from "@/lib/axios"
import type { ApiResponse, StatusPayload } from "../../shared/types/common.types"
import { removeEmptyValues } from "../../shared/utils/facility-error"
import type {
  CreateSchedulePayload,
  FacilityScheduleStats,
  Schedule,
  ScheduleListData,
  ScheduleQuery,
  UpdateSchedulePayload,
} from "../types/schedule.types"

const SCHEDULES_PATH = "/api/v1/schedules"

export async function fetchSchedules(query: ScheduleQuery = {}) {
  const response = await api.get<ApiResponse<ScheduleListData>>(
    SCHEDULES_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load schedules")
  }

  return response.data.data
}

export async function fetchScheduleById(id: string) {
  const response = await api.get<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}`
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load schedule")
  }

  return response.data.data
}

export async function createSchedule(payload: CreateSchedulePayload) {
  const response = await api.post<ApiResponse<Schedule>>(
    SCHEDULES_PATH,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to create schedule")
  }

  return response.data.data
}

export async function updateSchedule(
  id: string,
  payload: UpdateSchedulePayload
) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update schedule")
  }

  return response.data.data
}

export async function updateScheduleStatus(id: string, payload: StatusPayload) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}/status`,
    payload
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update schedule status")
  }

  return response.data.data
}

export async function cancelSchedule(id: string, notes?: string) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}/cancel`,
    { notes }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to cancel schedule")
  }

  return response.data.data
}

export async function fetchScheduleStats(): Promise<FacilityScheduleStats> {
  const data = await fetchSchedules({ page: 1, limit: 1 })
  return data.summary
}
