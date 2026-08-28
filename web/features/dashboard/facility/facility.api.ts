"use client"

import { useQuery, type QueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import api from "@/lib/axios"

import type {
  ApiResponse,
  AssignPayload,
  Complaint,
  ComplaintQuery,
  ComplaintStatus,
  ComplaintUpdatePayload,
  ComplaintsListData,
  CreateMaintenancePayload,
  CreateTechnicianPayload,
  FacilityDashboardData,
  FacilityComplaintStats,
  FacilityMaintenanceStats,
  FacilityTechnicianStats,
  Maintenance,
  MaintenanceListData,
  MaintenanceProgressPayload,
  MaintenanceQuery,
  MaintenanceStatus,
  MaintenanceUpdatePayload,
  ReasonPayload,
  RequiredReasonPayload,
  ReportsOverviewData,
  ReportsQuery,
  CreateSchedulePayload,
  FacilityScheduleStats,
  ReschedulePayload,
  Schedule,
  ScheduleListData,
  ScheduleQuery,
  UpdateSchedulePayload,
  UpdateScheduleStatusPayload,
  StatusPayload,
  Technician,
  TechnicianQuery,
  TechnicianStatus,
  TechnicianTasksData,
  TechnicianTasksQuery,
  TechniciansListData,
  UpdateTechnicianPayload,
  UpdateTechnicianStatusPayload,
  UpdateTechnicianTaskStatusPayload,
  AssignTechnicianWorkPayload,
} from "./facility.types"

type ApiErrorPayload = {
  message?: string
  error?: string
  details?: Array<{
    message?: string
  }>
}

const COMPLAINTS_PATH = "/api/v1/complaints"
const MAINTENANCE_PATH = "/api/v1/maintenance"
const TECHNICIANS_PATH = "/api/v1/technicians"
const REPORTS_PATH = "/api/v1/reports"
const SCHEDULES_PATH = "/api/v1/schedules"
const FACILITY_DASHBOARD_PATH = "/api/v1/facility/dashboard"

function removeEmptyValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null) return false
      if (typeof item === "string" && item.trim() === "") return false
      return true
    })
  ) as Partial<T>
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data
    const validationMessage = data?.details
      ?.map((item) => item.message)
      .filter(Boolean)
      .join(", ")

    return validationMessage || data?.message || data?.error || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

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

export async function updateComplaint(
  id: string,
  payload: ComplaintUpdatePayload
) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function assignComplaint(id: string, payload: AssignPayload) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/assign`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateComplaintStatus(
  id: string,
  payload: StatusPayload<ComplaintStatus>
) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/status`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function approveComplaint(id: string, remarks?: string) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/approve`,
    removeEmptyValues({ remarks })
  )

  return response.data
}

export async function rejectComplaint(id: string, payload: ReasonPayload) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/reject`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function cancelComplaint(id: string, reason?: string) {
  const response = await api.patch<ApiResponse<Complaint>>(
    `${COMPLAINTS_PATH}/${id}/cancel`,
    removeEmptyValues({ reason })
  )

  return response.data
}

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
    throw new Error(response.data.message || "Failed to load maintenance")
  }

  return response.data.data
}

export async function createMaintenance(payload: CreateMaintenancePayload) {
  const response = await api.post<ApiResponse<Maintenance>>(
    MAINTENANCE_PATH,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateMaintenance(
  id: string,
  payload: MaintenanceUpdatePayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function assignMaintenance(id: string, payload: AssignPayload) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/assign`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateMaintenanceStatus(
  id: string,
  payload: StatusPayload<MaintenanceStatus>
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/status`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function startMaintenance(id: string, remarks?: string) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/start`,
    removeEmptyValues({ remarks })
  )

  return response.data
}

export async function updateMaintenanceProgress(
  id: string,
  payload: MaintenanceProgressPayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/progress`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function approveMaintenance(id: string, remarks?: string) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/approve`,
    removeEmptyValues({ remarks })
  )

  return response.data
}

export async function rejectMaintenance(id: string, payload: ReasonPayload) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/reject`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function cancelMaintenance(id: string, reason?: string) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cancel`,
    removeEmptyValues({ reason })
  )

  return response.data
}

export async function closeMaintenance(id: string, remarks?: string) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/close`,
    removeEmptyValues({ remarks })
  )

  return response.data
}

export async function approveMaintenanceCost(id: string, remarks?: string) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cost/approve`,
    removeEmptyValues({ remarks })
  )

  return response.data
}

export async function rejectMaintenanceCost(
  id: string,
  payload: RequiredReasonPayload
) {
  const response = await api.patch<ApiResponse<Maintenance>>(
    `${MAINTENANCE_PATH}/${id}/cost/reject`,
    removeEmptyValues(payload)
  )

  return response.data
}

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

export async function fetchFacilityDashboard() {
  const response = await api.get<ApiResponse<FacilityDashboardData>>(
    FACILITY_DASHBOARD_PATH
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load facility dashboard")
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
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateTechnician(
  id: string,
  payload: UpdateTechnicianPayload
) {
  const response = await api.patch<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateTechnicianStatus(
  id: string,
  payload: UpdateTechnicianStatusPayload
) {
  const response = await api.patch<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}/status`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function deactivateTechnician(id: string) {
  const response = await api.delete<ApiResponse<Technician>>(
    `${TECHNICIANS_PATH}/${id}`
  )

  return response.data
}

export async function assignTechnicianWork(
  id: string,
  payload: AssignTechnicianWorkPayload
) {
  const response = await api.patch<
    ApiResponse<{
      technician: Technician
      workType: "complaint" | "maintenance"
      work: Complaint | Maintenance
    }>
  >(`${TECHNICIANS_PATH}/${id}/assign`, removeEmptyValues(payload))

  return response.data
}

export async function fetchTechnicianTasks(
  id: string,
  query: TechnicianTasksQuery = {}
) {
  const response = await api.get<ApiResponse<TechnicianTasksData>>(
    `${TECHNICIANS_PATH}/${id}/tasks`,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load technician tasks")
  }

  return response.data.data
}

export async function updateTechnicianTaskStatus(
  id: string,
  payload: UpdateTechnicianTaskStatusPayload
) {
  const response = await api.patch<
    ApiResponse<{
      technician: Technician
      workType: "complaint" | "maintenance"
      work: Complaint | Maintenance
    }>
  >(`${TECHNICIANS_PATH}/${id}/tasks/status`, removeEmptyValues(payload))

  return response.data
}

export async function fetchReportsOverview(query: ReportsQuery = {}) {
  const response = await api.get<ApiResponse<ReportsOverviewData>>(
    REPORTS_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load reports")
  }

  return response.data.data
}

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

export async function fetchMySchedules(query: ScheduleQuery = {}) {
  const response = await api.get<ApiResponse<ScheduleListData>>(
    `${SCHEDULES_PATH}/my`,
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
    removeEmptyValues(payload)
  )

  return response.data
}

export async function updateSchedule(
  id: string,
  payload: UpdateSchedulePayload
) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function rescheduleSchedule(
  id: string,
  payload: ReschedulePayload
) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}/reschedule`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function cancelSchedule(id: string, reason?: string) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}/cancel`,
    removeEmptyValues({ reason })
  )

  return response.data
}

export async function updateScheduleStatus(
  id: string,
  payload: UpdateScheduleStatusPayload
) {
  const response = await api.patch<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}/status`,
    removeEmptyValues(payload)
  )

  return response.data
}

export async function deleteSchedule(id: string) {
  const response = await api.delete<ApiResponse<Schedule>>(
    `${SCHEDULES_PATH}/${id}`
  )

  return response.data
}

async function countComplaints(status?: ComplaintStatus) {
  const data = await fetchComplaints({ status, page: 1, limit: 1 })
  return data.pagination.total
}

async function countMaintenance(status?: MaintenanceStatus) {
  const data = await fetchMaintenance({ status, page: 1, limit: 1 })
  return data.pagination.total
}

async function countTechnicians(status?: TechnicianStatus) {
  const data = await fetchTechnicians({ status, page: 1, limit: 1 })
  return data.pagination.total
}

export async function fetchScheduleStats(): Promise<FacilityScheduleStats> {
  const data = await fetchSchedules({ page: 1, limit: 1 })
  return data.summary
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

export async function fetchMaintenanceStats(): Promise<FacilityMaintenanceStats> {
  const [
    total,
    pending,
    assigned,
    inProgress,
    onHold,
    workCompleted,
    awaitingApproval,
    approved,
    closed,
    rejected,
  ] = await Promise.all([
    countMaintenance(),
    countMaintenance("PENDING"),
    countMaintenance("ASSIGNED"),
    countMaintenance("IN_PROGRESS"),
    countMaintenance("ON_HOLD"),
    countMaintenance("WORK_COMPLETED"),
    countMaintenance("AWAITING_APPROVAL"),
    countMaintenance("APPROVED"),
    countMaintenance("CLOSED"),
    countMaintenance("REJECTED"),
  ])

  return {
    total,
    pending,
    assigned,
    inProgress,
    active: pending + assigned + inProgress + onHold + rejected,
    completed: approved + closed,
    pendingApprovals: workCompleted + awaitingApproval,
  }
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

export function useComplaints(query: ComplaintQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["facility", "complaints", query],
    queryFn: () => fetchComplaints(query),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useFacilityDashboard() {
  return useQuery({
    queryKey: ["facility", "dashboard"],
    queryFn: fetchFacilityDashboard,
    staleTime: 30 * 1000,
  })
}

export function useComplaint(id: string | null) {
  return useQuery({
    queryKey: ["facility", "complaint", id],
    queryFn: () => fetchComplaintById(id as string),
    enabled: Boolean(id),
  })
}

export function useComplaintMaintenance(complaintId: string | null) {
  return useQuery({
    queryKey: ["facility", "complaint-maintenance", complaintId],
    queryFn: () =>
      fetchMaintenance({
        complaint: complaintId as string,
        page: 1,
        limit: 10,
      }),
    enabled: Boolean(complaintId),
  })
}

export function useMaintenance(query: MaintenanceQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["facility", "maintenance", query],
    queryFn: () => fetchMaintenance(query),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useMaintenanceDetail(id: string | null) {
  return useQuery({
    queryKey: ["facility", "maintenance-detail", id],
    queryFn: () => fetchMaintenanceById(id as string),
    enabled: Boolean(id),
  })
}

export function useTechnicians(query: TechnicianQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["facility", "technicians", query],
    queryFn: () => fetchTechnicians(query),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useTechnicianDetail(id: string | null) {
  return useQuery({
    queryKey: ["facility", "technician-detail", id],
    queryFn: () => fetchTechnicianById(id as string),
    enabled: Boolean(id),
  })
}

export function useTechnicianTasks(
  id: string | null,
  query: TechnicianTasksQuery = {}
) {
  return useQuery({
    queryKey: ["facility", "technician-tasks", id, query],
    queryFn: () => fetchTechnicianTasks(id as string, query),
    enabled: Boolean(id),
  })
}

export function useComplaintStats() {
  return useQuery({
    queryKey: ["facility", "complaint-stats"],
    queryFn: fetchComplaintStats,
    staleTime: 30 * 1000,
  })
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ["facility", "maintenance-stats"],
    queryFn: fetchMaintenanceStats,
    staleTime: 30 * 1000,
  })
}

export function useTechnicianStats() {
  return useQuery({
    queryKey: ["facility", "technician-stats"],
    queryFn: fetchTechnicianStats,
    staleTime: 30 * 1000,
  })
}

export function useReportsOverview(query: ReportsQuery = {}) {
  return useQuery({
    queryKey: ["facility", "reports", query],
    queryFn: () => fetchReportsOverview(query),
    staleTime: 30 * 1000,
  })
}

export function useSchedules(query: ScheduleQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["facility", "schedules", query],
    queryFn: () => fetchSchedules(query),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useMySchedules(query: ScheduleQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["facility", "my-schedules", query],
    queryFn: () => fetchMySchedules(query),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useScheduleDetail(id: string | null) {
  return useQuery({
    queryKey: ["facility", "schedule-detail", id],
    queryFn: () => fetchScheduleById(id as string),
    enabled: Boolean(id),
  })
}

export function useScheduleStats() {
  return useQuery({
    queryKey: ["facility", "schedule-stats"],
    queryFn: fetchScheduleStats,
    staleTime: 30 * 1000,
  })
}

export function invalidateFacilityData(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["facility"],
  })
}
