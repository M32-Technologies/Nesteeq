import { useQuery } from "@tanstack/react-query"
import {
  getManagerDeliveries,
  getManagerDeliveryAnalytics,
} from "../api/deliveries.api"
import type {
  DeliveryAnalyticsRange,
  GetDeliveriesParams,
} from "../types/deliveries"

export const managerDeliveryQueryKeys = {
  all: ["manager-deliveries"] as const,
  list: (params: GetDeliveriesParams) =>
    ["manager-deliveries", "list", params] as const,
  analytics: (range: DeliveryAnalyticsRange) =>
    ["manager-deliveries", "analytics", range] as const,
}

export const useManagerDeliveriesQuery = (params: GetDeliveriesParams = {}) => {
  return useQuery({
    queryKey: managerDeliveryQueryKeys.list(params),
    queryFn: () => getManagerDeliveries(params),
    staleTime: 30 * 1000,
  })
}

export const useManagerDeliveryAnalyticsQuery = (
  range: DeliveryAnalyticsRange = "7d"
) => {
  return useQuery({
    queryKey: managerDeliveryQueryKeys.analytics(range),
    queryFn: () => getManagerDeliveryAnalytics(range),
    staleTime: 30 * 1000,
  })
}
