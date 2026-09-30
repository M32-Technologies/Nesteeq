import api from "@/lib/axios"
import type {
  SubscriptionStats,
  SubscriptionAnalyticsData,
  SubscriptionPlanDistributionItem,
  SubscriptionPlanDistributionData,
  SubscriptionListResponse,
  SubscriptionItem,
  SubscriptionFilterParams,
} from "../types"

/**
 * Fetch subscription KPI statistics.
 * GET /api/v1/admin/subscriptions/stats
 */
export async function fetchSubscriptionStats(): Promise<SubscriptionStats> {
  const { data } = await api.get<{ success: boolean; data: SubscriptionStats }>(
    "/api/v1/admin/subscriptions/stats"
  )
  return data.data
}

/**
 * Fetch monthly subscription creation trend analytics for charts.
 * GET /api/v1/admin/subscriptions/analytics
 */
export async function fetchSubscriptionAnalytics(
  range: "3m" | "6m" | "12m" | "1y" = "6m"
): Promise<SubscriptionAnalyticsData> {
  const { data } = await api.get<{
    success: boolean
    data: SubscriptionAnalyticsData
  }>("/api/v1/admin/subscriptions/analytics", {
    params: { range },
  })
  return data.data
}

/**
 * Fetch subscription distribution grouped by plan.
 * GET /api/v1/admin/subscriptions/plan-distribution
 */
export async function fetchSubscriptionPlanDistribution(): Promise<
  SubscriptionPlanDistributionData
> {
  const { data } = await api.get<{
    success: boolean
    data: SubscriptionPlanDistributionData
  }>("/api/v1/admin/subscriptions/plan-distribution")
  return data.data
}

/**
 * Fetch a paginated, filterable, searchable list of subscriptions.
 * GET /api/v1/admin/subscriptions
 */
export async function fetchSubscriptions(
  params: SubscriptionFilterParams
): Promise<SubscriptionListResponse> {
  const { data } = await api.get<{
    success: boolean
    data: SubscriptionListResponse
  }>("/api/v1/admin/subscriptions", {
    params,
  })
  return data.data
}

/**
 * Fetch single subscription record details.
 * GET /api/v1/admin/subscriptions/:id
 */
export async function fetchSingleSubscription(
  id: string
): Promise<SubscriptionItem> {
  const { data } = await api.get<{
    success: boolean
    data: SubscriptionItem
  }>(`/api/v1/admin/subscriptions/${id}`)
  return data.data
}
