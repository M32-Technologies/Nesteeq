import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  getEmergencyAlerts,
  updateEmergencyAlertStatus,
} from "../api/alert.api"
import type { EmergencyAlertStatus } from "../schemas/alert"
import { securityDataQueryKeys } from "./useSecurityData"

export const alertQueryKeys = {
  list: (params: {
    status?: EmergencyAlertStatus
    search?: string
    page?: number
    limit?: number
  }) => ["security-alerts", params] as const,
}

export const useEmergencyAlerts = (params: {
  status?: EmergencyAlertStatus
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: alertQueryKeys.list(params),
    queryFn: () => getEmergencyAlerts(params),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
}

export const useUpdateEmergencyAlertStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEmergencyAlertStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["security-alerts"],
      })
      queryClient.invalidateQueries({
        queryKey: securityDataQueryKeys.summary,
      })
      queryClient.invalidateQueries({
        queryKey: securityDataQueryKeys.activityRoot,
      })
    },
  })
}
