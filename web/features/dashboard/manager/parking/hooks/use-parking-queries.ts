import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  generateParkingSlots,
  getParkingSlots,
  updateParkingSlot,
  updateParkingSlotStatus,
  type GenerateParkingSlotsPayload,
  type UpdateParkingSlotPayload,
  type VisitorParkingSlotStatus,
} from "../../../security/services/parking.service"

export const PARKING_QUERY_KEYS = {
  all: ["parking-slots"] as const,
  list: (filters: { status?: VisitorParkingSlotStatus; search?: string; page?: number; limit?: number }) =>
    [...PARKING_QUERY_KEYS.all, filters] as const,
}

export function useParkingSlotsQuery(filters: {
  status?: VisitorParkingSlotStatus
  search?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: PARKING_QUERY_KEYS.list(filters),
    queryFn: () => getParkingSlots(filters),
  })
}

export function useGenerateParkingSlotsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: GenerateParkingSlotsPayload) =>
      generateParkingSlots(payload),
    onSuccess: (data: any) => {
      toast.success(data?.message || "Parking slots generated successfully")
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to generate parking slots"
      )
    },
  })
}

export function useUpdateParkingSlotMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateParkingSlotPayload) =>
      updateParkingSlot(payload),
    onSuccess: () => {
      toast.success("Parking slot updated successfully")
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update parking slot"
      )
    },
  })
}

export function useUpdateParkingStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      slotId: string
      status: Exclude<VisitorParkingSlotStatus, "ALL" | "OCCUPIED">
      notes?: string
    }) => updateParkingSlotStatus(payload),
    onSuccess: () => {
      toast.success("Parking slot status updated successfully")
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update parking status"
      )
    },
  })
}
