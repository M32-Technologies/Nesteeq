import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";

import { Notification } from "./notification.model.js";
import type {
  CreateNotificationInput,
  CreateBulkNotificationsInput,
} from "./notification.types.js";
import type { GetNotificationsQuery } from "./notification.validation.js";

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

export type GetMyNotificationsParams = {
  userId: string;
  apartmentId?: string | null;
  query: GetNotificationsQuery;
};

export const getMyNotifications = async ({
  userId,
  apartmentId,
  query,
}: GetMyNotificationsParams) => {
  const { page, limit, unreadOnly } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    recipientUserId: userId,
  };

  if (unreadOnly) {
    filter.readAt = null;
  }

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.$or = [
      { apartment: normalizedApartmentId },
      { apartment: null },
      { apartment: { $exists: false } },
    ];
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export type GetUnreadNotificationCountParams = {
  userId: string;
  apartmentId?: string | null;
};

export const getUnreadNotificationCount = async ({
  userId,
  apartmentId,
}: GetUnreadNotificationCountParams): Promise<{ count: number }> => {
  const filter: Record<string, unknown> = {
    recipientUserId: userId,
    readAt: null,
  };

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.$or = [
      { apartment: normalizedApartmentId },
      { apartment: null },
      { apartment: { $exists: false } },
    ];
  }

  const count = await Notification.countDocuments(filter);

  return { count };
};

export type MarkNotificationAsReadParams = {
  notificationId: string;
  userId: string;
};

export const markNotificationAsRead = async ({
  notificationId,
  userId,
}: MarkNotificationAsReadParams) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipientUserId: userId,
  })
    .select("-__v")
    .lean();

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.readAt) {
    return { notification };
  }

  const updatedNotification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipientUserId: userId,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    },
    {
      new: true,
    }
  )
    .select("-__v")
    .lean();

  return { notification: updatedNotification ?? notification };
};

export type MarkAllNotificationsAsReadParams = {
  userId: string;
  apartmentId?: string | null;
};

export const markAllNotificationsAsRead = async ({
  userId,
  apartmentId,
}: MarkAllNotificationsAsReadParams): Promise<{ modifiedCount: number }> => {
  const filter: Record<string, unknown> = {
    recipientUserId: userId,
    readAt: null,
  };

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.$or = [
      { apartment: normalizedApartmentId },
      { apartment: null },
      { apartment: { $exists: false } },
    ];
  }

  const result = await Notification.updateMany(filter, {
    $set: { readAt: new Date() },
  });

  return {
    modifiedCount: result.modifiedCount,
  };
};

export type DeleteNotificationParams = {
  notificationId: string;
  userId: string;
};

export const deleteNotification = async ({
  notificationId,
  userId,
}: DeleteNotificationParams) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientUserId: userId,
  }).lean();

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return { notificationId };
};





