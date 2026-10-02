export const notificationTypes = [
  "NEW_COMPLAINT",
  "TASK_ASSIGNED",
  "MAINTENANCE_STATUS_UPDATED",
  "WORK_COMPLETED",
  "COST_SUBMITTED",
  "COST_APPROVED",
  "COST_REJECTED",
  "RESIDENT_CONFIRMATION_REQUESTED",
  "RESIDENT_CONFIRMATION_RECEIVED",
  "SCHEDULE_CREATED",
  "SCHEDULE_UPDATED",
  "SCHEDULE_CANCELLED",
  "ANNOUNCEMENT",
  "EMERGENCY_ANNOUNCEMENT",
  "EMERGENCY_ALERT",
  "SOS_ALERT",
  "RESIDENT_REGISTERED",
  "STAFF_REGISTERED",
  "DELIVERY_ARRIVED",
  "DELIVERY_COLLECTED",
] as const;

export const notificationSeverities = ["INFO", "SUCCESS", "WARNING", "ERROR"] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type NotificationSeverity = (typeof notificationSeverities)[number];

export interface INotification {
  apartment?: string | null;
  recipientUserId?: string | null;
  recipientRole?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  readAt?: Date | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNotificationInput = {
  apartment?: string | null;
  recipientUserId?: string | null;
  recipientRole?: string | null;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  createdBy?: string | null;
};

export type CreateBulkNotificationsInput = {
  apartment?: string | null;
  recipientUserIds: string[];
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  createdBy?: string | null;
};