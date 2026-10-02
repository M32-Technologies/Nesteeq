import { ObjectId, type Filter } from "mongodb";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import {
  isGlobalRole as isGlobalReportRole,
  MANAGEMENT_ROLE_SET as reportRoles,
  normalizeRole,
} from "../../utils/role.js";

import type { ReportQuery } from "./report.schema.js";
import type { AuthenticatedReportUser } from "./report.service.js";

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
};

export type ReportFilter = Record<string, unknown>;

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

export const ensureCurrentUserExists = async (user: AuthenticatedReportUser): Promise<void> => {
  const authUser = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(user.id) });

  if (!authUser) {
    throw new AppError("Authenticated user not found", 404);
  }
};

export const assertCanViewReports = (user: AuthenticatedReportUser): void => {
  if (!reportRoles.has(normalizeRole(user.role))) {
    throw new AppError("You do not have permission to view reports", 403);
  }
};

export const addOrToFilter = (
  filter: ReportFilter,
  clauses: Record<string, unknown>[]
): void => {
  if (filter.$or) {
    if (!filter.$and) {
      filter.$and = [];
    }
    (filter.$and as Record<string, unknown>[]).push({ $or: filter.$or });
    (filter.$and as Record<string, unknown>[]).push({ $or: clauses });
    delete filter.$or;
  } else if (filter.$and) {
    (filter.$and as Record<string, unknown>[]).push({ $or: clauses });
  } else {
    filter.$or = clauses;
  }
};

export const applyApartmentScope = (
  filter: ReportFilter,
  field: string,
  query: ReportQuery,
  user: AuthenticatedReportUser
): void => {
  const role = normalizeRole(user.role);
  const userApartmentId = normalizeOptionalString(user.apartmentId);

  const targetApt = !isGlobalReportRole(role) ? userApartmentId : (query.apartment || userApartmentId);

  if (!isGlobalReportRole(role)) {
    if (query.apartment && userApartmentId && query.apartment !== userApartmentId) {
      throw new AppError("You do not have permission to view reports for this apartment", 403);
    }
  }

  if (targetApt) {
    const aptValues: unknown[] = [targetApt];
    if (ObjectId.isValid(targetApt)) {
      aptValues.push(new ObjectId(targetApt));
    }

    if (field === "apartment") {
      addOrToFilter(filter, [
        { apartment: { $in: aptValues } },
        { apartmentId: { $in: aptValues } },
      ]);
    } else {
      addOrToFilter(filter, [
        { [field]: { $in: aptValues } },
        { apartment: { $in: aptValues } },
        { apartmentId: { $in: aptValues } },
      ]);
    }
  }
};
