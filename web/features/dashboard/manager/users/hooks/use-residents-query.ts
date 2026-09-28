import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  bulkCreateResidentInvitations,
  createResidentInvitation,
  downloadResidentInviteTemplate,
  getBlocks,
  getFlats,
  getResidentDetails,
  getResidents,
  getInvitations,
  getUserStats,
  resendInvitation,
  revokeInvitation,
  updateResidentDetails,
  updateResidentStatus,
} from "../api/users.api"
import type {
  CreateResidentInviteInput,
  FlatListParams,
  InvitationListParams,
  ResidentListParams,
  ResidentStatus,
  UpdateResidentInput,
} from "../types/users"

export const residentQueryKeys = {
  all: ["residents"] as const,
  list: (params: ResidentListParams) =>
    [...residentQueryKeys.all, "list", params] as const,
  details: (residentId: string) =>
    [...residentQueryKeys.all, "details", residentId] as const,
  stats: () => [...residentQueryKeys.all, "stats"] as const,
}

export const invitationQueryKeys = {
  all: ["invitations"] as const,
  list: (params: InvitationListParams) =>
    [...invitationQueryKeys.all, "list", params] as const,
}

export const residenceOptionQueryKeys = {
  blocks: (params?: { status?: "active" | "inactive"; search?: string }) =>
    ["blocks", params ?? "all"] as const,
  flats: (blockId?: string, params?: Record<string, unknown>) =>
    ["flats", blockId ?? "all", params ?? {}] as const,
}

export const useResidentsQuery = (params: ResidentListParams = {}) => {
  return useQuery({
    queryKey: residentQueryKeys.list(params),
    queryFn: () => getResidents(params),
    staleTime: 60 * 1000,
  })
}

export const useUserStatsQuery = () => {
  return useQuery({
    queryKey: residentQueryKeys.stats(),
    queryFn: getUserStats,
    staleTime: 60 * 1000,
  })
}

export const useInvitationsQuery = (params: InvitationListParams = {}) => {
  return useQuery({
    queryKey: invitationQueryKeys.list(params),
    queryFn: () => getInvitations(params),
    staleTime: 60 * 1000,
  })
}

export const useBlocksQuery = (params?: {
  status?: "active" | "inactive"
  search?: string
}) => {
  return useQuery({
    queryKey: residenceOptionQueryKeys.blocks(params),
    queryFn: () => getBlocks(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const useFlatsQuery = (params?: FlatListParams | string) => {
  const isString = typeof params === "string"
  const blockId = isString
    ? params === "all"
      ? undefined
      : params
    : params?.blockId
  const queryParams = isString
    ? { blockId: params === "all" ? undefined : params, limit: 500 }
    : params

  const isEnabled = isString
    ? Boolean(params)
    : Boolean(
        queryParams?.blockId ||
          queryParams?.occupancyStatus ||
          queryParams?.status
      )

  return useQuery({
    queryKey: residenceOptionQueryKeys.flats(
      blockId,
      typeof queryParams === "object" ? queryParams : undefined
    ),
    queryFn: () => getFlats(queryParams),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })
}

export const useResidentDetailsQuery = (residentId: string | null) => {
  return useQuery({
    queryKey: residentQueryKeys.details(residentId ?? ""),
    queryFn: () => getResidentDetails(residentId!),
    enabled: Boolean(residentId),
    staleTime: 60 * 1000,
  })
}

export const useUpdateResidentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      residentId,
      input,
    }: {
      residentId: string
      input: UpdateResidentInput
    }) => updateResidentDetails(residentId, input),
    onSuccess: (resident) => {
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.all })
      queryClient.setQueryData(
        residentQueryKeys.details(resident.id),
        resident
      )
    },
  })
}

export const useUpdateResidentStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      residentId,
      status,
    }: {
      residentId: string
      status: ResidentStatus
    }) => updateResidentStatus(residentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.all })
    },
  })
}

export const useResendInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.stats() })
    },
  })
}

export const useRevokeInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.stats() })
    },
  })
}

export const useCreateResidentInvitationMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateResidentInviteInput) =>
      createResidentInvitation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.stats() })
    },
  })
}

export const useBulkCreateResidentInvitationsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkCreateResidentInvitations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: residentQueryKeys.stats() })
    },
  })
}

export const useDownloadResidentInviteTemplateMutation = () => {
  return useMutation({
    mutationFn: downloadResidentInviteTemplate,
  })
}
