import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  assignResidentParking,
  generateParkingSlots,
  getParkingSlotById,
  getParkingSlots,
  getParkingStats,
  releaseResidentParking,
  updateParkingSlot,
  updateParkingSlotStatus,
} from "../api/parking.api"
import type {
  AssignResidentParkingInput,
  GenerateParkingSlotsInput,
  ParkingFilterParams,
  UpdateParkingSlotInput,
} from "../types/parking.types"

export const PARKING_QUERY_KEYS = {
  all: ["parking-slots"] as const,
  list: (filters: ParkingFilterParams) =>
    [...PARKING_QUERY_KEYS.all, "list", filters] as const,
  details: (parkingId: string) =>
    [...PARKING_QUERY_KEYS.all, "details", parkingId] as const,
  stats: () => [...PARKING_QUERY_KEYS.all, "stats"] as const,
}

export function useParkingSlotsQuery(filters: ParkingFilterParams = {}) {
  return useQuery({
    queryKey: PARKING_QUERY_KEYS.list(filters),
    queryFn: () => getParkingSlots(filters),
    staleTime: 30 * 1000,
  })
}

export function useParkingSlotDetailsQuery(parkingId: string | null) {
  return useQuery({
    queryKey: PARKING_QUERY_KEYS.details(parkingId ?? ""),
    queryFn: () => getParkingSlotById(parkingId!),
    enabled: Boolean(parkingId),
    staleTime: 30 * 1000,
  })
}

export function useParkingStatsQuery() {
  return useQuery({
    queryKey: PARKING_QUERY_KEYS.stats(),
    queryFn: getParkingStats,
    staleTime: 30 * 1000,
  })
}

export function useUpdateParkingSlotMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      parkingId,
      input,
    }: {
      parkingId: string
      input: UpdateParkingSlotInput
    }) => updateParkingSlot(parkingId, input),
    onSuccess: (data) => {
      toast.success(`Slot ${data.slotNumber} updated successfully`)
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update parking slot")
    },
  })
}

export function useUpdateParkingStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      parkingId,
      status,
    }: {
      parkingId: string
      status: "AVAILABLE" | "INACTIVE"
    }) => updateParkingSlotStatus(parkingId, status),
    onSuccess: (data) => {
      const msg =
        data.status === "INACTIVE"
          ? `Slot ${data.slotNumber} deactivated`
          : `Slot ${data.slotNumber} activated`
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update parking slot status")
    },
  })
}

export function useAssignResidentParkingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      parkingId,
      input,
    }: {
      parkingId: string
      input: AssignResidentParkingInput
    }) => assignResidentParking(parkingId, input),
    onSuccess: (data) => {
      toast.success(`Slot ${data.slotNumber} assigned successfully`)
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign resident parking")
    },
  })
}

export function useReleaseResidentParkingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (parkingId: string) => releaseResidentParking(parkingId),
    onSuccess: (data) => {
      toast.success(`Slot ${data.slotNumber} released successfully`)
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to release parking slot")
    },
  })
}

export function useGenerateParkingSlotsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: GenerateParkingSlotsInput) =>
      generateParkingSlots(input),
    onSuccess: (data) => {
      toast.success(
        `${data.totalSlotsGenerated} parking slots generated successfully`
      )
      queryClient.invalidateQueries({ queryKey: PARKING_QUERY_KEYS.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate parking slots")
    },
  })
}

