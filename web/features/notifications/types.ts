export type NotificationSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical"
  | "success";

export interface NotificationItem {
  _id: string;
  recipientUserId: string;
  recipientRole?: string;
  apartment?: string | null;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  readAt: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[];
  pagination: NotificationPagination;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface UnreadNotificationCountResponse {
  count: number;
}

export interface MarkAllNotificationsAsReadResponse {
  modifiedCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
