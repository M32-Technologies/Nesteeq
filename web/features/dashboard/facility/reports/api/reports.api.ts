import api from "@/lib/axios"
import type { ApiResponse } from "../../shared/types/common.types"
import { removeEmptyValues } from "../../shared/utils/facility-error"
import type { ReportsOverviewData, ReportsQuery } from "../types/reports.types"

const REPORTS_PATH = "/api/v1/reports"

export async function fetchReportsOverview(query: ReportsQuery = {}) {
  const response = await api.get<ApiResponse<ReportsOverviewData>>(
    REPORTS_PATH,
    {
      params: removeEmptyValues(query),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to load reports overview")
  }

  return response.data.data
}
