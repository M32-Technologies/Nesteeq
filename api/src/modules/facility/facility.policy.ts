import { ObjectId, type Filter } from "mongodb";
import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  MANAGEMENT_ROLE_SET as managementRoles,
  normalizeRole,
} from "../../utils/role.js";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { normalizeOptionalString } from "../../utils/serviceHelpers.js";
import type { AuthenticatedFacilityUser } from "./facility.service.js";

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
};

export type FacilityFilter = Record<string, any>;

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

export const ensureCurrentUserExists = async (user: AuthenticatedFacilityUser): Promise<void> => {
  const existingUser = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(user.id) });

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }
};

export const assertCanViewFacilityDashboard = (user: AuthenticatedFacilityUser): void => {
  if (!managementRoles.has(normalizeRole(user.role))) {
    throw new AppError("You do not have permission to view facility operations", 403);
  }
};

export const scopedFilter = (
  user: AuthenticatedFacilityUser,
  apartmentField: string
): FacilityFilter => {
  const role = normalizeRole(user.role);

  if (globalManagementRoles.has(role)) {
    return {};
  }

  const apartmentId = normalizeOptionalString(user.apartmentId);

  if (!apartmentId) {
    throw new AppError("Management user must be linked to an apartment", 403);
  }

  return { [apartmentField]: apartmentId };
};

export const hasDashboardApartmentScope = (user: AuthenticatedFacilityUser): boolean => {
  const role = normalizeRole(user.role);

  return globalManagementRoles.has(role) || Boolean(normalizeOptionalString(user.apartmentId));
};
