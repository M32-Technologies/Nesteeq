import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  checkInVisitor,
  checkoutVisitor,
  getActiveVisitors,
  getVisitorHistory,
  getVisitorRecords,
  registerManualVisitor,
  verifyVisitorPass,
  type ManualVisitorInput,
  type VisitorRecordsParams,
} from "../services/visitor.service"
import { securityDataQueryKeys } from "./useSecurityData"

export const visitorQueryKeys = {
  records: (params: VisitorRecordsParams) =>
    ["security-visitors", "records", params] as const,
  active: ["security-visitors", "active"] as const,
  history: ["security-visitors", "history"] as const,
}

const invalidateVisitorQueries = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  queryClient.invalidateQueries({
    queryKey: ["security-visitors", "records"],
  })

  queryClient.invalidateQueries({
    queryKey: visitorQueryKeys.active,
  })

  queryClient.invalidateQueries({
    queryKey: visitorQueryKeys.history,
  })

  queryClient.invalidateQueries({
    queryKey: securityDataQueryKeys.summary,
  })

  queryClient.invalidateQueries({
    queryKey: securityDataQueryKeys.activityRoot,
  })
}

export const useVerifyVisitorPass = () => {
  return useMutation({
    mutationFn: (token: string) =>
      verifyVisitorPass(token),
  })
}

export const useCheckInVisitor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (visitorPassId: string) =>
      checkInVisitor(visitorPassId),

    onSuccess: () => {
      invalidateVisitorQueries(queryClient)
    },
  })
}

export const useRegisterManualVisitor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ManualVisitorInput) =>
      registerManualVisitor(data),

    onSuccess: () => {
      invalidateVisitorQueries(queryClient)
    },
  })
}

export const useActiveVisitors = (
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: [
      ...visitorQueryKeys.active,
      page,
      limit,
    ],

    queryFn: () =>
      getActiveVisitors(page, limit),
  })
}

export const useVisitorRecords = (
  params: VisitorRecordsParams
) => {
  return useQuery({
    queryKey: visitorQueryKeys.records(params),
    queryFn: () => getVisitorRecords(params),
  })
}

export const useCheckoutVisitor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (visitId: string) =>
      checkoutVisitor(visitId),

    onSuccess: () => {
      invalidateVisitorQueries(queryClient)
    },
  })
}

export const useVisitorHistory = (
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: [
      ...visitorQueryKeys.history,
      page,
      limit,
    ],

    queryFn: () =>
      getVisitorHistory(page, limit),
  })
}
