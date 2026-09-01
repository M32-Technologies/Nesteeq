import { ObjectId, type Filter } from "mongodb";
import { MANAGEMENT_ROLE_SET as reportRoles } from "../../constants/roles.js";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isGlobalRole as isGlobalReportRole, normalizeRole } from "../../utils/role.js";
import { normalizeOptionalString } from "../../utils/serviceHelpers.js";
import type { ReportQuery } from "./report.schema.js";
import type { AuthenticatedReportUser } from "./report.service.js";

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

export const applyApartmentScope = (
  filter: ReportFilter,
  field: string,
  query: ReportQuery,
  user: AuthenticatedReportUser
): void => {
  const role = normalizeRole(user.role);
  const userApartmentId = normalizeOptionalString(user.apartmentId);

  if (!isGlobalReportRole(role)) {
    if (!userApartmentId) {
      throw new AppError("User must be linked to an apartment to view reports", 403);
    }

    if (query.apartment && query.apartment !== userApartmentId) {
      throw new AppError("You do not have permission to view reports for this apartment", 403);
    }

    filter[field] = userApartmentId;
    return;
  }

  if (query.apartment) {
    filter[field] = query.apartment;
  }
};
