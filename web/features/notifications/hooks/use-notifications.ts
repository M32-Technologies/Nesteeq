import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notifications.api";
import type {
  GetNotificationsParams,
  GetNotificationsResponse,
  UnreadNotificationCountResponse,
} from "../types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationQueryKeys.all, "list"] as const,
  list: (params: GetNotificationsParams = {}) =>
    [...notificationQueryKeys.lists(), params] as const,
  unreadCount: () => [...notificationQueryKeys.all, "unread-count"] as const,
};

export const useNotifications = (
  params: GetNotificationsParams = { page: 1, limit: 10 }
) => {
  return useQuery<GetNotificationsResponse, Error>({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getNotifications(params),
    staleTime: 30 * 1000,
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery<UnreadNotificationCountResponse, Error>({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
};
