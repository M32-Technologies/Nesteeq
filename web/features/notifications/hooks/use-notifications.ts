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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      const previousLists = queryClient.getQueriesData<GetNotificationsResponse>({
        queryKey: notificationQueryKeys.lists(),
      });
      const previousUnread = queryClient.getQueryData<UnreadNotificationCountResponse>(
        notificationQueryKeys.unreadCount()
      );

      let wasUnread = false;

      queryClient.setQueriesData<GetNotificationsResponse>(
        { queryKey: notificationQueryKeys.lists() },
        (old) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => {
              if (n._id === id) {
                if (!n.readAt) wasUnread = true;
                return { ...n, readAt: n.readAt || new Date().toISOString() };
              }
              return n;
            }),
          };
        }
      );

      if (wasUnread) {
        queryClient.setQueryData<UnreadNotificationCountResponse>(
          notificationQueryKeys.unreadCount(),
          (old) => ({
            count: Math.max(0, (old?.count ?? 1) - 1),
          })
        );
      }

      return { previousLists, previousUnread };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnread
        );
      }
    },
    onSettled: () => {
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      const previousLists = queryClient.getQueriesData<GetNotificationsResponse>({
        queryKey: notificationQueryKeys.lists(),
      });
      const previousUnread = queryClient.getQueryData<UnreadNotificationCountResponse>(
        notificationQueryKeys.unreadCount()
      );

      const now = new Date().toISOString();
      queryClient.setQueriesData<GetNotificationsResponse>(
        { queryKey: notificationQueryKeys.lists() },
        (old) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => ({
              ...n,
              readAt: n.readAt || now,
            })),
          };
        }
      );

      queryClient.setQueryData<UnreadNotificationCountResponse>(
        notificationQueryKeys.unreadCount(),
        () => ({ count: 0 })
      );

      return { previousLists, previousUnread };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnread
        );
      }
    },
    onSettled: () => {
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
    onMutate: async (id: string) => {
      // 1. Cancel ongoing fetches so they don't overwrite optimistic delete
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      // 2. Snapshot current data for rollback
      const previousLists = queryClient.getQueriesData<GetNotificationsResponse>({
        queryKey: notificationQueryKeys.lists(),
      });
      const previousUnread = queryClient.getQueryData<UnreadNotificationCountResponse>(
        notificationQueryKeys.unreadCount()
      );

      let wasUnread = false;

      // 3. Immediately remove the item from all cached lists (instant UI delete)
      queryClient.setQueriesData<GetNotificationsResponse>(
        { queryKey: notificationQueryKeys.lists() },
        (old) => {
          if (!old?.notifications) return old;
          const target = old.notifications.find((n) => n._id === id);
          if (target && !target.readAt) {
            wasUnread = true;
          }
          return {
            ...old,
            notifications: old.notifications.filter((n) => n._id !== id),
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  total: Math.max(0, old.pagination.total - 1),
                }
              : old.pagination,
          };
        }
      );

      // 4. If the deleted item was unread, immediately decrement the unread badge
      if (wasUnread) {
        queryClient.setQueryData<UnreadNotificationCountResponse>(
          notificationQueryKeys.unreadCount(),
          (old) => ({
            count: Math.max(0, (old?.count ?? 1) - 1),
          })
        );
      }

      return { previousLists, previousUnread };
    },
    onError: (_err, _id, context) => {
      // Rollback to snapshots on network or server error
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnread
        );
      }
    },
    onSettled: () => {
      // Always sync with the server after mutation finishes
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
};
