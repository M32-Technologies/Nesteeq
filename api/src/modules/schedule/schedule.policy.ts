import { Types } from "mongoose";
import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  isManagementRole,
  isMaintenanceRole,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  normalizeRole,
} from "../../utils/role.js";
import { AppError } from "../../utils/AppError.js";
import { escapeRegex, normalizeOptionalString, sameId } from "../../utils/serviceHelpers.js";
import type { GetSchedulesQuery } from "./schedule.schema.js";
import type { AuthenticatedScheduleUser } from "./schedule.service.js";
import { getDateBounds } from "./schedule.workflow.js";

export type ScheduleFilter = Record<string, unknown>;

export const assertManagerCanManageApartment = (
  user: AuthenticatedScheduleUser,
  apartmentId?: string | null
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage schedules", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const targetApartmentId = normalizeOptionalString(apartmentId);

  if (!globalManagementRoles.has(role) && !managerApartmentId) {
    throw new AppError("Management user must be linked to an apartment", 403);
  }

  if (!globalManagementRoles.has(role) && targetApartmentId && managerApartmentId !== targetApartmentId) {
    throw new AppError("You do not have permission to manage schedules for this apartment", 403);
  }
};

export const assertCanAccessSchedule = (
  user: AuthenticatedScheduleUser,
  schedule: {
    apartment?: string | null;
    technicianUserId?: string | null;
  }
): void => {
  if (isManagementRole(user.role)) {
    assertManagerCanManageApartment(user, schedule.apartment);
    return;
  }

  if (isMaintenanceRole(user.role) && sameId(schedule.technicianUserId, user.id)) {
    return;
  }

  throw new AppError("You do not have permission to access this schedule", 403);
};

export const buildScheduleFilter = (
  query: GetSchedulesQuery,
  user: AuthenticatedScheduleUser
): ScheduleFilter => {
  const role = normalizeRole(user.role);
  const filter: ScheduleFilter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.workType) {
    filter.workType = query.workType;
  }

  if (query.technician) {
    filter.technician = new Types.ObjectId(query.technician);
  }

  if (query.date) {
    const { start, end } = getDateBounds(query.date);
    filter.startAt = { $gte: start, $lte: end };
  } else if (query.startDate || query.endDate) {
    const range: Record<string, Date> = {};

    if (query.startDate) {
      range.$gte = getDateBounds(query.startDate).start;
    }

    if (query.endDate) {
      range.$lte = getDateBounds(query.endDate).end;
    }

    filter.startAt = range;
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { title: search },
      { description: search },
      { technicianUserId: search },
      { apartment: search },
      { flat: search },
    ];
  }

  if (managementRoles.has(role)) {
    const managerApartmentId = normalizeOptionalString(user.apartmentId);

    if (!globalManagementRoles.has(role)) {
      if (!managerApartmentId) {
        throw new AppError("Management user must be linked to an apartment", 403);
      }

      filter.apartment = managerApartmentId;
    }
  } else if (maintenanceRoles.has(role)) {
    filter.technicianUserId = user.id;
  } else {
    throw new AppError("You do not have permission to access schedules", 403);
  }

  return filter;
};
