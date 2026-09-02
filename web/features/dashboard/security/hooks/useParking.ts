import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  assignParkingSlot,
  createParkingSlot,
  getParkingSlots,
  releaseParkingSlot,
  updateParkingSlotStatus,
  type AssignParkingPayload,
  type VisitorParkingSlotStatus,
} from "../services/parking.service"
import { securityDataQueryKeys } from "./useSecurityData"

export const parkingQueryKeys = {
  slots: (params: {
    status?: VisitorParkingSlotStatus
    search?: string
  }) => ["security-parking", "slots", params] as const,
}

export const useParkingSlots = (params: {
  status?: VisitorParkingSlotStatus
  search?: string
}) => {
  return useQuery({
    queryKey: parkingQueryKeys.slots(params),
    queryFn: () => getParkingSlots(params),
  })
}

export const useCreateParkingSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createParkingSlot,
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

export const useUpdateParkingSlotStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateParkingSlotStatus,
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
