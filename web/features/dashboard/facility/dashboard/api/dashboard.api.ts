import api from "@/lib/axios"
import type { ApiResponse } from "../../shared/types/common.types"
import type { FacilityDashboardData } from "../types/dashboard.types"

const FACILITY_DASHBOARD_PATH = "/api/v1/facility/dashboard"

export async function fetchFacilityDashboard() {
  const response = await api.get<ApiResponse<FacilityDashboardData>>(
    FACILITY_DASHBOARD_PATH
  )

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to load facility dashboard"
    )
  }

  return response.data.data
}
