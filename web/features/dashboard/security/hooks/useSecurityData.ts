import { useQuery } from "@tanstack/react-query"

import {
  getSecurityActivity,
  getSecurityFlats,
  getSecurityResidents,
  getSecuritySummary,
} from "../services/security.service"

export const securityDataQueryKeys = {
  summary: ["security", "summary"] as const,
  activityRoot: ["security", "activity"] as const,
  activity: (params?: { limit?: number }) =>
    ["security", "activity", params] as const,
  flats: ["security", "flats"] as const,
  residents: (params: {
    search?: string
    page?: number
    limit?: number
  }) => ["security", "residents", params] as const,
}

export const useSecuritySummary = () => {
  return useQuery({
    queryKey: securityDataQueryKeys.summary,
    queryFn: getSecuritySummary,
  })
}

export const useSecurityActivity = (params?: {
  limit?: number
}) => {
  return useQuery({
    queryKey: securityDataQueryKeys.activity(params),
    queryFn: () => getSecurityActivity(params),
  })
}

export const useSecurityFlats = () => {
  return useQuery({
    queryKey: securityDataQueryKeys.flats,
    queryFn: getSecurityFlats,
  })
}

export const useSecurityResidents = (params: {
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: securityDataQueryKeys.residents(params),
    queryFn: () => getSecurityResidents(params),
  })
}
