import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  RESIDENT_ROLE_SET as residentRoles,
  normalizeRole,
} from "../../utils/role.js";
import { AppError } from "../../utils/AppError.js";



import type { AuthenticatedComplaintUser } from "./complaint.service.js";
import type { ComplaintDocument } from "./complaint.model.js";

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

export const assertManagerCanManageComplaint = (
  user: AuthenticatedComplaintUser,
  complaint: ComplaintDocument
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage complaints", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const rawComplaintApartment = (complaint as any).apartment ?? (complaint as any).apartmentId;
  const complaintApartmentId = normalizeOptionalString(rawComplaintApartment);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (!complaintApartmentId || !sameId(complaintApartmentId, managerApartmentId)) {
      throw new AppError("You do not have permission to manage this complaint", 403);
    }
  }
};

export const assertStaffAssignedToComplaint = (
  user: AuthenticatedComplaintUser,
  complaint: ComplaintDocument
): void => {
  if (!maintenanceRoles.has(normalizeRole(user.role))) {
    throw new AppError("Only maintenance staff can perform this action", 403);
  }

  if (!complaint.assignedStaff || !sameId(complaint.assignedStaff, user.id)) {
    throw new AppError("You can only access complaints assigned to you", 403);
  }
};

export const assertCanAccessComplaint = (
  user: AuthenticatedComplaintUser,
  complaint: ComplaintDocument
): void => {
  const role = normalizeRole(user.role);

  if (managementRoles.has(role)) {
    assertManagerCanManageComplaint(user, complaint);
    return;
  }

  if (maintenanceRoles.has(role)) {
    assertStaffAssignedToComplaint(user, complaint);
    return;
  }

  if (residentRoles.has(role)) {
    if (!sameId(complaint.resident, user.id)) {
      throw new AppError("You can only access your own complaints", 403);
    }
    return;
  }

  throw new AppError("You do not have permission to access complaints", 403);
};
