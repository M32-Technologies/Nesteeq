import { normalizeRole } from "../../utils/role.js";
import { normalizeOptionalString } from "../../utils/serviceHelpers.js";
import {
  Notification,
  type NotificationSeverity,
  type NotificationType,
} from "./notification.model.js";

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

export const createNotification = async (data: CreateNotificationInput): Promise<void> => {
  try {
    await Notification.create({
      apartment: normalizeOptionalString(data.apartment),
      recipientUserId: normalizeOptionalString(data.recipientUserId),
      recipientRole: data.recipientRole ? normalizeRole(data.recipientRole) : null,
      type: data.type,
      severity: data.severity ?? "INFO",
      title: data.title,
      message: data.message,
      relatedResourceType: normalizeOptionalString(data.relatedResourceType),
      relatedResourceId: normalizeOptionalString(data.relatedResourceId),
      createdBy: normalizeOptionalString(data.createdBy),
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
};
