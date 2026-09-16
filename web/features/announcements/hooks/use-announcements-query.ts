import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  broadcastEmergency,
  createAnnouncement,
  deleteAnnouncement,
  getActiveBlocks,
  getAnnouncementById,
  getAnnouncements,
  updateAnnouncement,
  updateAnnouncementStatus,
} from "../api/announcements.api";
import type {
  AnnouncementFilterState,
  AnnouncementStatus,
  CreateAnnouncementFormData,
  EmergencyBroadcastFormData,
} from "../types";

export const announcementQueryKeys = {
  all: ["announcements"] as const,
  list: (filters: Partial<AnnouncementFilterState>) =>
    [...announcementQueryKeys.all, "list", filters] as const,
  details: (id: string) => [...announcementQueryKeys.all, "detail", id] as const,
  activeBlocks: ["blocks", "active"] as const,
};

export const useAnnouncementsQuery = (filters: Partial<AnnouncementFilterState>) => {
  return useQuery({
    queryKey: announcementQueryKeys.list(filters),
    queryFn: () => getAnnouncements(filters),
    staleTime: 30 * 1000,
  });
};

export const useAnnouncementDetailsQuery = (id: string | null) => {
  return useQuery({
    queryKey: announcementQueryKeys.details(id || ""),
    queryFn: () => getAnnouncementById(id!),
    enabled: Boolean(id),
  });
};

export const useActiveBlocksQuery = () => {
  return useQuery({
    queryKey: announcementQueryKeys.activeBlocks,
    queryFn: getActiveBlocks,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAnnouncementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: CreateAnnouncementFormData) =>
      createAnnouncement(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
    },
  });
};

export const useUpdateAnnouncementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string;
      formData: Partial<CreateAnnouncementFormData>;
    }) => updateAnnouncement(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.details(variables.id),
      });
    },
  });
};

export const useUpdateAnnouncementStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AnnouncementStatus;
    }) => updateAnnouncementStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.details(variables.id),
      });
    },
  });
};

export const useDeleteAnnouncementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
    },
  });
};

export const useBroadcastEmergencyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: EmergencyBroadcastFormData) =>
      broadcastEmergency(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
    },
  });
};
