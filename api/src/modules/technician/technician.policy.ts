import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  isManagementRole,
  isMaintenanceRole,
  MANAGEMENT_ROLE_SET as managementRoles,
  normalizeRole,
} from "../../utils/role.js";
import { AppError } from "../../utils/AppError.js";
import { Types } from "mongoose";
import type { GetTechniciansQuery } from "./technician.schema.js";
import type { AuthenticatedTechnicianUser } from "./technician.service.js";

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const sameId = (id1: any, id2: any): boolean => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

const escapeRegex = (text: string): string => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

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
  }

  const targetApartmentId = !globalManagementRoles.has(role)
    ? managerApartmentId
    : (normalizeOptionalString(query.apartmentId) ?? managerApartmentId);

  const andClauses: Record<string, unknown>[] = [];

  if (targetApartmentId) {
    const aptValues: unknown[] = [targetApartmentId];
    if (Types.ObjectId.isValid(targetApartmentId)) {
      aptValues.push(new Types.ObjectId(targetApartmentId));
    }

    andClauses.push({
      $or: [
        { apartment: { $in: aptValues } },
        { apartmentId: { $in: aptValues } },
      ],
    });
  }

  if (query.status && query.status.toLowerCase() !== "all") {
    andClauses.push({
      status: { $regex: new RegExp(`^${escapeRegex(query.status)}$`, "i") },
    });
  }

  if (query.specialization) {
    andClauses.push({
      specializations: query.specialization,
    });
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search.trim()), "i");
    andClauses.push({
      $or: [
        { fullName: search },
        { name: search },
        { email: search },
        { phone: search },
        { employeeCode: search },
        { userId: search },
      ],
    });
  }

  if (andClauses.length === 1) {
    return andClauses[0];
  }

  if (andClauses.length > 1) {
    return { $and: andClauses };
  }

  return filter;
};
