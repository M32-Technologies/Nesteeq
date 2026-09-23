import api from "@/lib/axios"
import type {
  RevenueStats,
  RevenueAnalyticsData,
  PaymentListResponse,
  PaymentStatus,
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
 * Fetch a paginated, filterable, searchable list of payments.
 * GET /api/v1/admin/payments
 */
export async function fetchPayments(params: {
  page?: number
  limit?: number
  search?: string
  status?: PaymentStatus
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
