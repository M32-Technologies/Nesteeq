import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  RESIDENT_ROLE_SET as residentRoles,
  isGlobalRole as isGlobalManagementRole,
  isMaintenanceRole,
  normalizeRole,
} from "../../utils/role.js";
import { AppError } from "../../utils/AppError.js";
import { normalizeOptionalString, sameId } from "../../utils/serviceHelpers.js";
import type { GetMaintenanceQuery } from "./maintenance.schema.js";
import type { AuthenticatedMaintenanceUser } from "./maintenance.service.js";
import type { MaintenanceDocument } from "./maintenance.model.js";

type MaintenanceFilter = Record<string, unknown>;

type AuthUserRecord = {
  _id?: { toHexString: () => string };
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  flatId?: string | null;
};

const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

export const assertManagerCanManageApartment = (
  user: AuthenticatedMaintenanceUser,
  apartmentId?: string | null
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage maintenance", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const targetApartmentId = normalizeOptionalString(apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (!targetApartmentId || targetApartmentId !== managerApartmentId) {
      throw new AppError("You do not have permission to manage maintenance for this apartment", 403);
    }
  }
};

export const assertManagerCanManageMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  assertManagerCanManageApartment(user, maintenance.apartment);
};

export const assertStaffAssignedToMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  if (!isMaintenanceRole(user.role)) {
    throw new AppError("Only maintenance staff can perform this action", 403);
  }

  if (!maintenance.assignedStaff || !sameId(maintenance.assignedStaff, user.id)) {
    throw new AppError("You can only access maintenance assigned to you", 403);
  }
};

export const assertCanAccessMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  const role = normalizeRole(user.role);

  if (managementRoles.has(role)) {
    assertManagerCanManageMaintenance(user, maintenance);
    return;
  }

  if (maintenanceRoles.has(role)) {
    assertStaffAssignedToMaintenance(user, maintenance);
    return;
  }

  if (residentRoles.has(role)) {
    if (!sameId(maintenance.resident, user.id)) {
      throw new AppError("You can only access maintenance related to your own complaints", 403);
    }
    return;
  }

  throw new AppError("You do not have permission to access maintenance", 403);
};

export const ensureStaffCanWorkOnApartment = (
  staff: AuthUserRecord,
  fallbackStaffId: string,
  apartmentId: string | null | undefined,
  manager: AuthenticatedMaintenanceUser
): string => {
  const staffId = getAuthUserId(staff, fallbackStaffId);
  const staffApartmentId = normalizeOptionalString(staff.apartmentId);
  const managerApartmentId = normalizeOptionalString(manager.apartmentId);
  const targetApartmentId = normalizeOptionalString(apartmentId);
  const isGlobalManager = isGlobalManagementRole(manager.role);

  if (!isGlobalManager) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (!staffApartmentId || staffApartmentId !== managerApartmentId) {
      throw new AppError("Staff member does not belong to your apartment", 403);
    }
  }

  if (staffApartmentId && staffApartmentId !== targetApartmentId) {
    throw new AppError("Staff member does not belong to this apartment", 400);
  }

  return staffId;
};

const applySharedFilters = (
  filter: MaintenanceFilter,
  query: GetMaintenanceQuery
): void => {
  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.complaint) {
    filter.complaint = query.complaint;
  }

  if (query.costStatus) {
    filter["costReview.status"] = query.costStatus;
  }
};

const applyManagerFilters = (
  filter: MaintenanceFilter,
  query: GetMaintenanceQuery,
  user: AuthenticatedMaintenanceUser
): void => {
  const role = normalizeRole(user.role);
  const managerApartmentId = normalizeOptionalString(user.apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (query.apartment && query.apartment !== managerApartmentId) {
      throw new AppError("You do not have permission to view maintenance for this apartment", 403);
    }

    filter.apartment = managerApartmentId;
  } else if (query.apartment) {
    filter.apartment = query.apartment;
  }

  if (query.flat) {
    filter.flat = query.flat;
  }

  if (query.resident) {
    filter.resident = query.resident;
  }

  if (query.assignedStaff) {
    filter.assignedStaff = query.assignedStaff;
  }
};

export const buildRoleScopedFilter = (
  query: GetMaintenanceQuery,
  user: AuthenticatedMaintenanceUser
): MaintenanceFilter => {
  const role = normalizeRole(user.role);
  const filter: MaintenanceFilter = {};

  applySharedFilters(filter, query);

  if (managementRoles.has(role)) {
    applyManagerFilters(filter, query, user);
  } else if (maintenanceRoles.has(role)) {
    filter.assignedStaff = user.id;
  } else if (residentRoles.has(role)) {
    filter.resident = user.id;
  } else {
    throw new AppError("You do not have permission to access maintenance", 403);
  }

  return filter;
};
