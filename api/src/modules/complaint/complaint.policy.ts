import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  RESIDENT_ROLE_SET as residentRoles,
} from "../../constants/roles.js";
import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";
import { normalizeOptionalString, sameId } from "../../utils/serviceHelpers.js";
import type { AuthenticatedComplaintUser } from "./complaint.service.js";
import type { ComplaintDocument } from "./complaint.model.js";

export const assertManagerCanManageComplaint = (
  user: AuthenticatedComplaintUser,
  complaint: ComplaintDocument
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage complaints", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const complaintApartmentId = normalizeOptionalString(complaint.apartment);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (!complaintApartmentId || complaintApartmentId !== managerApartmentId) {
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
