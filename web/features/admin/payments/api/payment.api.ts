import api from "@/lib/axios"
import type {
  RevenueStats,
  RevenueAnalyticsData,
  PaymentListResponse,
  PaymentStatus,
  BillingBreakdownData,
  TopSocietyRevenueItem,
  SubscriptionPaymentItem,
} from "../types"

/**
 * Fetch executive revenue & payment KPI statistics.
 * GET /api/v1/admin/payments/stats
 */
export async function fetchRevenueStats(): Promise<RevenueStats> {
  const { data } = await api.get<{ success: boolean; data: RevenueStats }>(
    "/api/v1/admin/payments/stats"
  )
  return data.data
}

/**
 * Fetch monthly revenue trend analytics for charts.
 * GET /api/v1/admin/payments/analytics
 */
export async function fetchRevenueAnalytics(
  range: "3m" | "6m" | "12m" | "1y" = "6m"
): Promise<RevenueAnalyticsData> {
  const { data } = await api.get<{
    success: boolean
    data: RevenueAnalyticsData
  }>("/api/v1/admin/payments/analytics", {
    params: { range },
  })
  return data.data
}

/**
 * Fetch subscription billing breakdown for donut chart & status.
 * GET /api/v1/admin/payments/breakdown
 */
export async function fetchBillingBreakdown(): Promise<BillingBreakdownData> {
  const { data } = await api.get<{
    success: boolean
    data: BillingBreakdownData
  }>("/api/v1/admin/payments/breakdown")
  return data.data
}

/**
 * Fetch top societies by revenue for horizontal ranking bar chart.
 * GET /api/v1/admin/payments/top-societies
 */
export async function fetchTopRevenueSocieties(
  limit: number = 5
): Promise<TopSocietyRevenueItem[]> {
  const { data } = await api.get<{
    success: boolean
    data: TopSocietyRevenueItem[]
  }>("/api/v1/admin/payments/top-societies", {
    params: { limit },
  })
  return data.data
}

/**
 * Fetch a paginated, filterable, searchable list of payments.
 * GET /api/v1/admin/payments
 */
export async function fetchPayments(params: {
  page?: number
  limit?: number
  search?: string
  status?: PaymentStatus
  type?: string
  startDate?: string
  endDate?: string
  sortBy?: "paidAt" | "amount" | "createdAt"
  sortOrder?: "asc" | "desc"
}): Promise<PaymentListResponse> {
  const { data } = await api.get<{
    success: boolean
    data: PaymentListResponse
  }>("/api/v1/admin/payments", {
    params,
  })
  return data.data
}

/**
 * Fetch single payment record details.
 * GET /api/v1/admin/payments/:id
 */
export async function fetchPaymentDetails(
  id: string
): Promise<SubscriptionPaymentItem> {
  const { data } = await api.get<{
    success: boolean
    data: SubscriptionPaymentItem
  }>(`/api/v1/admin/payments/${id}`)
  return data.data
}
