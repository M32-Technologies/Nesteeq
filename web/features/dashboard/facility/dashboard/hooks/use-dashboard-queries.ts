import { useQuery } from "@tanstack/react-query"
import { fetchFacilityDashboard } from "../api/dashboard.api"

export const dashboardQueryKeys = {
  all: ["facility-dashboard"] as const,
  overview: () => [...dashboardQueryKeys.all, "overview"] as const,
}

export function useFacilityDashboardQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: fetchFacilityDashboard,
    staleTime: 30 * 1000,
  })
}
