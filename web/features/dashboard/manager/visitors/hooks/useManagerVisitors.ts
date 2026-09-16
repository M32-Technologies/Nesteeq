import { useQuery } from "@tanstack/react-query"
import {
  getManagerActiveVisitors,
  getManagerVisitorRecords,
  type GetVisitorRecordsParams,
} from "../api/visitors.api"

export const managerVisitorQueryKeys = {
  all: ["manager-visitors"] as const,
  records: (params: GetVisitorRecordsParams) =>
    ["manager-visitors", "records", params] as const,
  active: ["manager-visitors", "active"] as const,
}

export const useManagerVisitorsQuery = (
  params: GetVisitorRecordsParams = {}
) => {
  return useQuery({
    queryKey: managerVisitorQueryKeys.records(params),
    queryFn: () => getManagerVisitorRecords(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useManagerActiveVisitorsQuery = () => {
  return useQuery({
    queryKey: managerVisitorQueryKeys.active,
    queryFn: () => getManagerActiveVisitors(1, 100),
    staleTime: 30 * 1000,
  })
}
