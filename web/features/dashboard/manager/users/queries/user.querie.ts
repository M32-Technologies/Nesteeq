import { useQuery } from "@tanstack/react-query"

import { getResidents } from "../user.api"
import type { ResidentListParams } from "../types/users"

export const residentQueryKeys = {
  all: ["residents"] as const,
  list: (params: ResidentListParams) =>
    [...residentQueryKeys.all, "list", params] as const,
}

export const useResidentsQuery = (params: ResidentListParams = {}) => {
  return useQuery({
    queryKey: residentQueryKeys.list(params),
    queryFn: () => getResidents(params),
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
