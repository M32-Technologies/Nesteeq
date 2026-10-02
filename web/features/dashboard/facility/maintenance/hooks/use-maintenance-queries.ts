import { useQuery } from "@tanstack/react-query"
import { fetchMaintenance, fetchMaintenanceById, fetchMaintenanceStats } from "../api/maintenance.api"
import type { MaintenanceQuery } from "../types/maintenance.types"

export const maintenanceQueryKeys = {
  all: ["facility-maintenance"] as const,
  list: (query?: MaintenanceQuery) => [...maintenanceQueryKeys.all, "list", query] as const,
  details: (id: string) => [...maintenanceQueryKeys.all, "details", id] as const,
  stats: () => [...maintenanceQueryKeys.all, "stats"] as const,
}

export function useMaintenanceQuery(query?: MaintenanceQuery) {
  return useQuery({
    queryKey: maintenanceQueryKeys.list(query),
    queryFn: () => fetchMaintenance(query),
    staleTime: 30 * 1000,
  })
}

export function useMaintenanceStatsQuery() {
  return useQuery({
    queryKey: maintenanceQueryKeys.stats(),
    queryFn: fetchMaintenanceStats,
    staleTime: 60 * 1000,
  })
}

export function useMaintenanceDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: maintenanceQueryKeys.details(id ?? ""),
    queryFn: () => fetchMaintenanceById(id!),
    enabled: Boolean(id),
  })
}
