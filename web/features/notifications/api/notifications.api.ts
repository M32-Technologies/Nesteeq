import api from "@/lib/axios";
import type {
  ApiResponse,
  GetNotificationsParams,
  GetNotificationsResponse,
  MarkAllNotificationsAsReadResponse,
  NotificationItem,
  UnreadNotificationCountResponse,
} from "../types";

export const getNotifications = async (
  params: GetNotificationsParams = {}
): Promise<GetNotificationsResponse> => {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.unreadOnly !== undefined) queryParams.unreadOnly = params.unreadOnly;

  const response = await api.get<ApiResponse<GetNotificationsResponse>>(
    "/api/v1/notifications",
    { params: queryParams }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch notifications");
  }

  return response.data.data;
};

export const getUnreadNotificationCount = async (): Promise<UnreadNotificationCountResponse> => {
  const response = await api.get<ApiResponse<UnreadNotificationCountResponse>>(
    "/api/v1/notifications/unread-count"
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to fetch unread notification count"
    );
  }

  return response.data.data;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<NotificationItem> => {
  const response = await api.patch<ApiResponse<{ notification: NotificationItem }>>(
    `/api/v1/notifications/${notificationId}/read`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to mark notification as read"
    );
  }

  return response.data.data.notification;
};

export const markAllNotificationsAsRead = async (): Promise<MarkAllNotificationsAsReadResponse> => {
  const response = await api.patch<ApiResponse<MarkAllNotificationsAsReadResponse>>(
    "/api/v1/notifications/read-all"
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to mark all notifications as read"
    );
  }

  return response.data.data;
};

export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(
    `/api/v1/notifications/${notificationId}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to delete notification"
    );
  }
};
