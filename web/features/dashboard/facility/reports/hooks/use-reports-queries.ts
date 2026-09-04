import { useQuery } from "@tanstack/react-query"
import { fetchReportsOverview } from "../api/reports.api"
import type { ReportsQuery } from "../types/reports.types"

export const reportQueryKeys = {
  all: ["facility-reports"] as const,
  overview: (query?: ReportsQuery) => [...reportQueryKeys.all, "overview", query] as const,
}

export function useReportsOverviewQuery(query?: ReportsQuery) {
  return useQuery({
    queryKey: reportQueryKeys.overview(query),
    queryFn: () => fetchReportsOverview(query),
    staleTime: 60 * 1000,
  })
}
