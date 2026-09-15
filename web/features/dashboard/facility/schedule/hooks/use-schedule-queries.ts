import { useQuery } from "@tanstack/react-query"
import { fetchSchedules, fetchScheduleStats } from "../api/schedule.api"
import type { ScheduleQuery } from "../types/schedule.types"

export const scheduleQueryKeys = {
  all: ["facility-schedules"] as const,
  list: (query?: ScheduleQuery) => [...scheduleQueryKeys.all, "list", query] as const,
  details: (id: string) => [...scheduleQueryKeys.all, "details", id] as const,
  stats: () => [...scheduleQueryKeys.all, "stats"] as const,
}

export function useSchedulesQuery(query?: ScheduleQuery) {
  return useQuery({
    queryKey: scheduleQueryKeys.list(query),
    queryFn: () => fetchSchedules(query),
    staleTime: 30 * 1000,
  })
}

export function useScheduleStatsQuery() {
  return useQuery({
    queryKey: scheduleQueryKeys.stats(),
    queryFn: fetchScheduleStats,
    staleTime: 60 * 1000,
  })
}
