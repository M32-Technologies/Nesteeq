import api from "@/lib/axios"
import type {
  ApartmentStats,
  ApartmentListResponse,
  ApartmentDetail,
  ApartmentItem,
} from "../types"

/**
 * Fetch aggregate apartment statistics (total, active, pending_payment, inactive).
 * GET /api/v1/admin/apartments/stats
 */
export async function fetchApartmentStats(): Promise<ApartmentStats> {
  const { data } = await api.get<{ success: boolean; data: ApartmentStats }>(
    "/api/v1/admin/apartments/stats"
  )
  return data.data
}

/**
 * Fetch a paginated, filterable, searchable list of apartments.
 * GET /api/v1/admin/apartments
 */
export async function fetchApartments(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}): Promise<ApartmentListResponse> {
  const { data } = await api.get<{ success: boolean; data: ApartmentListResponse }>(
    "/api/v1/admin/apartments",
    { params }
  )
  return data.data
}

/**
 * Fetch a single apartment by ID (including manager user info).
 * GET /api/v1/admin/apartments/:id
 */
export async function fetchApartmentById(id: string): Promise<ApartmentDetail> {
  const { data } = await api.get<{ success: boolean; data: ApartmentDetail }>(
    `/api/v1/admin/apartments/${id}`
  )
  return data.data
}

/**
 * Update an apartment's status (active | inactive).
 * PATCH /api/v1/admin/apartments/:id/status
 */
export async function updateApartmentStatus(
  id: string,
  status: "active" | "inactive"
): Promise<ApartmentItem> {
  const { data } = await api.patch<{ success: boolean; data: ApartmentItem }>(
    `/api/v1/admin/apartments/${id}/status`,
    { status }
  )
  return data.data
}

/**
 * Fetch apartment onboarding analytics over time.
 * GET /api/v1/admin/apartments/analytics
 */
export async function fetchApartmentAnalytics(
  range: "3m" | "6m" | "12m" | "1y" = "6m"
): Promise<import("../types").ApartmentAnalyticsData> {
  const { data } = await api.get<{
    success: boolean
    data: import("../types").ApartmentAnalyticsData
  }>("/api/v1/admin/apartments/analytics", {
    params: { range },
  })
  return data.data
}



