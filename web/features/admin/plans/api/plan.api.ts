import api from "@/lib/axios"
import type {
  SubscriptionPlan,
  PlanListResponse,
  CreatePlanInput,
  UpdatePlanInput,
} from "../types"

export async function fetchSubscriptionPlans(params?: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: "planName" | "price" | "durationMonths" | "createdAt"
  sortOrder?: "asc" | "desc"
}): Promise<PlanListResponse> {
  const { data } = await api.get<{ success: boolean; data: PlanListResponse }>(
    "/api/v1/admin/subscription-plans",
    { params }
  )
  return data.data
}

export async function fetchSubscriptionPlanById(
  id: string
): Promise<SubscriptionPlan> {
  const { data } = await api.get<{ success: boolean; data: SubscriptionPlan }>(
    `/api/v1/admin/subscription-plans/${id}`
  )
  return data.data
}

export async function createSubscriptionPlan(
  payload: CreatePlanInput
): Promise<SubscriptionPlan> {
  const { data } = await api.post<{
    success: boolean
    message: string
    data: SubscriptionPlan
  }>("/api/v1/admin/subscription-plans", payload)
  return data.data
}

export async function updateSubscriptionPlan(
  id: string,
  payload: UpdatePlanInput
): Promise<SubscriptionPlan> {
  const { data } = await api.patch<{
    success: boolean
    message: string
    data: SubscriptionPlan
  }>(`/api/v1/admin/subscription-plans/${id}`, payload)
  return data.data
}

export async function updateSubscriptionPlanStatus(
  id: string,
  isActive: boolean
): Promise<SubscriptionPlan> {
  const { data } = await api.patch<{
    success: boolean
    message: string
    data: SubscriptionPlan
  }>(`/api/v1/admin/subscription-plans/${id}/status`, { isActive })
  return data.data
}
