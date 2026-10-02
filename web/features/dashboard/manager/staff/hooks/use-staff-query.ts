import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createStaffInvitation,
  getStaff,
  getStaffDetails,
  getStaffInvitations,
  getStaffStats,
  resendStaffInvitation,
  revokeStaffInvitation,
  updateStaffDetails,
  updateStaffStatus,
} from "../api/staff.api"
import type {
  CreateStaffInviteInput,
  StaffInvitationListParams,
  StaffListParams,
  StaffStatus,
  UpdateStaffInput,
} from "../types/staff"

export const staffQueryKeys = {
  all: ["staff"] as const,
  list: (params: StaffListParams) =>
    [...staffQueryKeys.all, "list", params] as const,
  details: (staffId: string) =>
    [...staffQueryKeys.all, "details", staffId] as const,
  stats: () => [...staffQueryKeys.all, "stats"] as const,
}

export const staffInvitationQueryKeys = {
  all: ["staff-invitations"] as const,
  list: (params: StaffInvitationListParams) =>
    [...staffInvitationQueryKeys.all, "list", params] as const,
}

export const useStaffQuery = (params: StaffListParams = {}) => {
  return useQuery({
    queryKey: staffQueryKeys.list(params),
    queryFn: () => getStaff(params),
    staleTime: 60 * 1000,
  })
}

export const useStaffStatsQuery = () => {
  return useQuery({
    queryKey: staffQueryKeys.stats(),
    queryFn: getStaffStats,
    staleTime: 60 * 1000,
  })
}

export const useStaffDetailsQuery = (staffId: string | null) => {
  return useQuery({
    queryKey: staffQueryKeys.details(staffId ?? ""),
    queryFn: () => getStaffDetails(staffId!),
    enabled: Boolean(staffId),
    staleTime: 60 * 1000,
  })
}

export const useStaffInvitationsQuery = (
  params: StaffInvitationListParams = {}
) => {
  return useQuery({
    queryKey: staffInvitationQueryKeys.list(params),
    queryFn: () => getStaffInvitations(params),
    staleTime: 60 * 1000,
  })
}

export const useCreateStaffInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateStaffInviteInput) =>
      createStaffInvitation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.stats() })
    },
  })
}

export const useUpdateStaffMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      staffId,
      input,
    }: {
      staffId: string
      input: UpdateStaffInput
    }) => updateStaffDetails(staffId, input),
    onSuccess: (staff) => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
      queryClient.setQueryData(staffQueryKeys.details(staff.id), staff)
    },
  })
}

export const useUpdateStaffStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      staffId,
      status,
    }: {
      staffId: string
      status: StaffStatus
    }) => updateStaffStatus(staffId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
    },
  })
}

export const useResendStaffInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resendStaffInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.stats() })
    },
  })
}

export const useRevokeStaffInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeStaffInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.stats() })
    },
  })
}
