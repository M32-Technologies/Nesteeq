import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createDelivery,
  getDeliveries,
  updateDeliveryStatus,
} from "../api/delivery.api"
import type {
  CreateDeliveryPayload,
  DeliveryStatus,
} from "../schemas/delivery"
import { securityDataQueryKeys } from "./useSecurityData"

export const deliveryQueryKeys = {
  list: (params: {
    status?: DeliveryStatus
    search?: string
    page?: number
    limit?: number
  }) => ["security-deliveries", params] as const,
}

export const useDeliveries = (params: {
  status?: DeliveryStatus
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: deliveryQueryKeys.list(params),
    queryFn: () => getDeliveries(params),
  })
}

export const useCreateDelivery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDeliveryPayload) =>
      createDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["security-deliveries"],
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

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["security-deliveries"],
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
