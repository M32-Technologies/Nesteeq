import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";
import {
  sendRealtimeNotification,
  sendRealtimeNotificationToRole,
} from "../../socket/socket.js";

import { Notification } from "./notification.model.js";
import type {
  CreateNotificationInput,
  CreateBulkNotificationsInput,
} from "./notification.types.js";
import type { GetNotificationsQuery } from "./notification.validation.js";

const normalizeOptionalString = (
  value: string | null | undefined
): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const createNotification = async (
  data: CreateNotificationInput
): Promise<void> => {
  try {
    const doc = await Notification.create({
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

    const payload = {
      _id: doc._id.toString(),
      id: doc._id.toString(),
      apartment: doc.apartment,
      recipientUserId: doc.recipientUserId,
      recipientRole: doc.recipientRole,
      type: doc.type,
      severity: doc.severity,
      title: doc.title,
      message: doc.message,
      relatedResourceType: doc.relatedResourceType,
      relatedResourceId: doc.relatedResourceId,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
    };

    if (doc.recipientUserId) {
      sendRealtimeNotification(doc.recipientUserId, payload);
    }

    if (doc.recipientRole) {
      sendRealtimeNotificationToRole(
        doc.recipientRole,
        payload,
        doc.apartment ?? undefined
      );
    }
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
};

export const createBulkNotifications = async (
  data: CreateBulkNotificationsInput
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

    // Emit real-time events to all recipient users
    const now = new Date();
    for (const userId of uniqueIds) {
      sendRealtimeNotification(userId, {
        apartment: sharedFields.apartment,
        recipientUserId: userId,
        type: sharedFields.type,
        severity: sharedFields.severity,
        title: sharedFields.title,
        message: sharedFields.message,
        relatedResourceType: sharedFields.relatedResourceType,
        relatedResourceId: sharedFields.relatedResourceId,
        readAt: null,
        createdAt: now,
      });
    }
  } catch (error) {
    console.error(
      `Bulk notification creation failed (attempted ${docs.length}):`,
      error
    );
  }
};

export type GetMyNotificationsParams = {
  userId: string;
  role?: string | null;
  apartmentId?: string | null;
  query: GetNotificationsQuery;
};

export const getMyNotifications = async ({
  userId,
  role,
  apartmentId,
  query,
}: GetMyNotificationsParams) => {
  const { page, limit, unreadOnly } = query;
  const skip = (page - 1) * limit;

  const normalizedRole = role ? normalizeRole(role) : null;
  const recipientConditions: Record<string, unknown>[] = [
    { recipientUserId: userId },
  ];

  if (normalizedRole) {
    recipientConditions.push({ recipientRole: normalizedRole });
  }

  const filter: Record<string, unknown> = {
    $or: recipientConditions,
  };

  if (unreadOnly) {
    filter.readAt = null;
  }

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.apartment = {
      $in: [normalizedApartmentId, null, undefined],
    };
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
  role?: string | null;
  apartmentId?: string | null;
};

export const getUnreadNotificationCount = async ({
  userId,
  role,
  apartmentId,
}: GetUnreadNotificationCountParams): Promise<{ count: number }> => {
  const normalizedRole = role ? normalizeRole(role) : null;
  const recipientConditions: Record<string, unknown>[] = [
    { recipientUserId: userId },
  ];

  if (normalizedRole) {
    recipientConditions.push({ recipientRole: normalizedRole });
  }

  const filter: Record<string, unknown> = {
    $or: recipientConditions,
    readAt: null,
  };

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.apartment = {
      $in: [normalizedApartmentId, null, undefined],
    };
  }

  const count = await Notification.countDocuments(filter);

  return { count };
};

export type MarkNotificationAsReadParams = {
  notificationId: string;
  userId: string;
  role?: string | null;
};

export const markNotificationAsRead = async ({
  notificationId,
  userId,
  role,
}: MarkNotificationAsReadParams) => {
  const normalizedRole = role ? normalizeRole(role) : null;
  const recipientConditions: Record<string, unknown>[] = [
    { recipientUserId: userId },
  ];

  if (normalizedRole) {
    recipientConditions.push({ recipientRole: normalizedRole });
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    $or: recipientConditions,
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
      $or: recipientConditions,
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
  role?: string | null;
  apartmentId?: string | null;
};

export const markAllNotificationsAsRead = async ({
  userId,
  role,
  apartmentId,
}: MarkAllNotificationsAsReadParams): Promise<{ modifiedCount: number }> => {
  const normalizedRole = role ? normalizeRole(role) : null;
  const recipientConditions: Record<string, unknown>[] = [
    { recipientUserId: userId },
  ];

  if (normalizedRole) {
    recipientConditions.push({ recipientRole: normalizedRole });
  }

  const filter: Record<string, unknown> = {
    $or: recipientConditions,
    readAt: null,
  };

  const normalizedApartmentId = normalizeOptionalString(apartmentId);
  if (normalizedApartmentId) {
    filter.apartment = {
      $in: [normalizedApartmentId, null, undefined],
    };
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
  role?: string | null;
};

export const deleteNotification = async ({
  notificationId,
  userId,
  role,
}: DeleteNotificationParams) => {
  const normalizedRole = role ? normalizeRole(role) : null;
  const recipientConditions: Record<string, unknown>[] = [
    { recipientUserId: userId },
  ];

  if (normalizedRole) {
    recipientConditions.push({ recipientRole: normalizedRole });
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    $or: recipientConditions,
  }).lean();

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return { notificationId };
};
