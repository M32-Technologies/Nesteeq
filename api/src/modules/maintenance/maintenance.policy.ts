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



import { Types } from "mongoose";
import type { GetMaintenanceQuery } from "./maintenance.schema.js";
import type { AuthenticatedMaintenanceUser } from "./maintenance.service.js";
import type { MaintenanceDocument } from "./maintenance.model.js";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else if (typeof value === "object" && value !== null && "_id" in value) {
    str = String((value as any)._id);
  } else if (typeof (value as any)?.toHexString === "function") {
    str = (value as any).toHexString();
  } else if (typeof (value as any)?.toString === "function") {
    str = (value as any).toString();
    if (str === "[object Object]") return undefined;
  } else {
    str = String(value);
  }
  const trimmed = str.trim();
  return trimmed === "" ? undefined : trimmed;
};

const sameId = (id1: any, id2: any): boolean => {
  if (!id1 || !id2) return false;
  return id1.toString().toLowerCase() === id2.toString().toLowerCase();
};



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

    if (!targetApartmentId || !sameId(targetApartmentId, managerApartmentId)) {
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

  const candidateIds = [user.id];
  if ((user as any).technicianId) candidateIds.push((user as any).technicianId);
  if ((user as any).staffRecordId) candidateIds.push((user as any).staffRecordId);

  const isAssigned =
    candidateIds.some((id) => sameId(maintenance.assignedStaff, id)) ||
    candidateIds.some((id) => sameId((maintenance as any).assignedTo, id)) ||
    candidateIds.some((id) => sameId((maintenance as any).technician, id));

  if (!isAssigned) {
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

    if (staffApartmentId && staffApartmentId !== managerApartmentId) {
      throw new AppError("Staff member does not belong to your apartment", 403);
    }
  }

  if (staffApartmentId && targetApartmentId && staffApartmentId !== targetApartmentId) {
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

  const complaintId = query.complaint || (query as any).complaintId;
  if (complaintId) {
    filter.complaint = Types.ObjectId.isValid(complaintId)
      ? new Types.ObjectId(complaintId)
      : complaintId;
  }

  if (query.costStatus) {
    filter["costReview.status"] = query.costStatus;
  }

  if (query.search && query.search.trim()) {
    const rawSearch = query.search.trim();
    const searchRegex = new RegExp(escapeRegex(rawSearch), "i");
    const orConditions: Array<Record<string, unknown>> = [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
      { category: searchRegex },
      { priority: searchRegex },
      { status: searchRegex },
      { assignedWorkerName: searchRegex },
    ];

    const cleanId = rawSearch.toUpperCase().startsWith("JOB-")
      ? rawSearch.slice(4).trim()
      : rawSearch;
    if (Types.ObjectId.isValid(cleanId)) {
      orConditions.push({ _id: new Types.ObjectId(cleanId) });
    }

    if (Array.isArray(filter.$and)) {
      filter.$and.push({ $or: orConditions });
    } else if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: orConditions }];
      delete filter.$or;
    } else {
      filter.$or = orConditions;
    }
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

    if (query.apartment && !sameId(query.apartment, managerApartmentId)) {
      throw new AppError("You do not have permission to view maintenance for this apartment", 403);
    }

    const aptValues: unknown[] = [managerApartmentId];
    if (Types.ObjectId.isValid(managerApartmentId)) {
      aptValues.push(new Types.ObjectId(managerApartmentId));
    }
    filter.apartment = { $in: aptValues };
  } else if (query.apartment) {
    const aptValues: unknown[] = [query.apartment];
    if (Types.ObjectId.isValid(query.apartment)) {
      aptValues.push(new Types.ObjectId(query.apartment));
    }
    filter.apartment = { $in: aptValues };
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
    const candidateIds = [user.id];
    if ((user as any).technicianId) candidateIds.push((user as any).technicianId);
    if ((user as any).staffRecordId) candidateIds.push((user as any).staffRecordId);
    filter.$or = [
      { assignedStaff: { $in: candidateIds } },
      { assignedTo: { $in: candidateIds } },
      { technician: { $in: candidateIds } },
    ];
  } else if (residentRoles.has(role)) {
    filter.resident = user.id;
  } else {
    throw new AppError("You do not have permission to access maintenance", 403);
  }

  return filter;
};
