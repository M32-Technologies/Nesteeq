import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import {
  APARTMENT_SCOPED_ALERT_ROLE_SET as apartmentScopedRoles,
  GLOBAL_ROLE_SET as globalRoles,
} from "../../constants/roles.js";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";
import { Alert, type AlertSeverity, type AlertType } from "./alert.modal.js";
import type { GetAlertsQuery } from "./alert.schema.js";

export type AuthenticatedAlertUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
};

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
};

export type CreateAlertInput = {
  apartment?: string | null;
  recipientUserId?: string | null;
  recipientRole?: string | null;
  type: AlertType;
  severity?: AlertSeverity;
  title: string;
  message: string;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  createdBy?: string | null;
};

type AlertFilter = Record<string, unknown>;

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

const ensureCurrentUserExists = async (user: AuthenticatedAlertUser): Promise<void> => {
  const existingUser = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(user.id) });

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }
};

const buildVisibilityFilter = (user: AuthenticatedAlertUser): AlertFilter => {
  const role = normalizeRole(user.role);
  const userApartmentId = normalizeOptionalString(user.apartmentId);

  if (globalRoles.has(role)) {
    return {};
  }

  const visibleConditions: AlertFilter[] = [{ recipientUserId: user.id }];

  if (apartmentScopedRoles.has(role)) {
    if (!userApartmentId) {
      throw new AppError("User must be linked to an apartment to view alerts", 403);
    }

    visibleConditions.push({
      recipientRole: role,
      apartment: userApartmentId,
    });
  }

  visibleConditions.push({
    recipientRole: role,
    apartment: null,
  });

  return { $or: visibleConditions };
};

export const createAlert = async (data: CreateAlertInput): Promise<void> => {
  try {
    await Alert.create({
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
    console.error("Alert creation failed:", error);
  }
};

export const getAlerts = async (
  query: GetAlertsQuery,
  user: AuthenticatedAlertUser
) => {
  await ensureCurrentUserExists(user);

  const filter: AlertFilter = buildVisibilityFilter(user);

  if (query.type) {
    filter.type = query.type;
  }

  if (query.unreadOnly) {
    filter.readAt = null;
  }

  const skip = (query.page - 1) * query.limit;
  const [alerts, total, unread] = await Promise.all([
    Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Alert.countDocuments(filter),
    Alert.countDocuments({ ...filter, readAt: null }),
  ]);

  return {
    alerts,
    unread,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const markAlertRead = async (
  alertId: string,
  user: AuthenticatedAlertUser
) => {
  await ensureCurrentUserExists(user);

  if (!Types.ObjectId.isValid(alertId)) {
    throw new AppError("Invalid alert ID", 400);
  }

  const filter: AlertFilter = {
    _id: new Types.ObjectId(alertId),
    ...buildVisibilityFilter(user),
  };

  const alert = await Alert.findOneAndUpdate(
    filter,
    { $set: { readAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  return alert;
};
