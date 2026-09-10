import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  assignParkingSlot,
  getParkingSlots,
  releaseParkingSlot,
} from "../api/parking.api"
import type {
  AssignParkingPayload,
  VisitorParkingSlotStatus,
} from "../schemas/parking"
import { securityDataQueryKeys } from "./useSecurityData"

export const parkingQueryKeys = {
  slots: (params: {
    status?: VisitorParkingSlotStatus
    search?: string
    page?: number
    limit?: number
  }) => ["security-parking", "slots", params] as const,
}

export const useParkingSlots = (params: {
  status?: VisitorParkingSlotStatus
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: parkingQueryKeys.slots(params),
    queryFn: () => getParkingSlots(params),
  })
}

export const useAssignParkingSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AssignParkingPayload) =>
      assignParkingSlot(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["security-parking"],
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

export const useReleaseParkingSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (slotId: string) =>
      releaseParkingSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["security-parking"],
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
