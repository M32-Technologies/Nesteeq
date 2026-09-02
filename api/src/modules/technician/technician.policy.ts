import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  isManagementRole,
  isMaintenanceRole,
  MANAGEMENT_ROLE_SET as managementRoles,
  normalizeRole,
} from "../../utils/role.js";
import { AppError } from "../../utils/AppError.js";
import { escapeRegex, normalizeOptionalString, sameId } from "../../utils/serviceHelpers.js";
import type { GetTechniciansQuery } from "./technician.schema.js";
import type { AuthenticatedTechnicianUser } from "./technician.service.js";

type TechnicianFilter = Record<string, unknown>;

export const assertManagerCanManageApartment = (
  user: AuthenticatedTechnicianUser,
  apartmentId?: string | null
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage technicians", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const targetApartmentId = normalizeOptionalString(apartmentId);

  if (!globalManagementRoles.has(role) && !managerApartmentId) {
    throw new AppError("Management user must be linked to an apartment", 403);
  }

  if (!globalManagementRoles.has(role) && targetApartmentId && managerApartmentId !== targetApartmentId) {
    throw new AppError("You do not have permission to manage technicians for this apartment", 403);
  }
};

export const assertCanAccessTechnician = (
  user: AuthenticatedTechnicianUser,
  technician: { userId: string; apartmentId?: string | null }
): void => {
  if (isManagementRole(user.role)) {
    assertManagerCanManageApartment(user, technician.apartmentId);
    return;
  }

  if (isMaintenanceRole(user.role) && sameId(user.id, technician.userId)) {
    return;
  }

  throw new AppError("You do not have permission to access this technician", 403);
};

export const buildRoleScopedFilter = (
  query: GetTechniciansQuery,
  user: AuthenticatedTechnicianUser
): TechnicianFilter => {
  const role = normalizeRole(user.role);
  const filter: TechnicianFilter = {};

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to view technicians", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      filter._id = { $in: [] };
      return filter;
    }

    if (query.apartmentId && query.apartmentId !== managerApartmentId) {
      throw new AppError("You do not have permission to view technicians for this apartment", 403);
    }

    filter.apartmentId = managerApartmentId;
  } else if (query.apartmentId) {
    filter.apartmentId = query.apartmentId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.specialization) {
    filter.specializations = query.specialization;
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { fullName: search },
      { email: search },
      { phone: search },
      { employeeCode: search },
      { userId: search },
    ];
  }

  return filter;
};
