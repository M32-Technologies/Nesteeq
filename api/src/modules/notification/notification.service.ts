import { normalizeRole } from "../../utils/role.js";

import { Notification } from "./notification.model.js";
import type {
  CreateNotificationInput,
  CreateBulkNotificationsInput,
} from "./notification.types.js";

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
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

export const createBulkNotifications = async (
  data: CreateBulkNotificationsInput,
): Promise<void> => {
  const uniqueIds = [...new Set(data.recipientUserIds)]
    .map((id) => id?.trim())
    .filter((id): id is string => !!id);

  if (uniqueIds.length === 0) return;

  const sharedFields = {
    apartment: normalizeOptionalString(data.apartment),
    type: data.type,
    severity: data.severity ?? "INFO",
    title: data.title,
    message: data.message,
    relatedResourceType: normalizeOptionalString(data.relatedResourceType),
    relatedResourceId: normalizeOptionalString(data.relatedResourceId),
    createdBy: normalizeOptionalString(data.createdBy),
    recipientRole: null,
    readAt: null,
  };

  const docs = uniqueIds.map((userId) => ({
    ...sharedFields,
    recipientUserId: userId,
  }));

  try {
    await Notification.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error(`Bulk notification creation failed (attempted ${docs.length}):`, error);
  }
};
