import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";
import { normalizeOptionalString } from "../../utils/serviceHelpers.js";
import type { ComplaintStatus } from "../complaint/complaint.model.js";
import type { MaintenanceStatus } from "../maintenance/maintenance.model.js";
import type { TechnicianStatus } from "../technician/technician.model.js";
import type { AuthenticatedScheduleUser } from "./schedule.service.js";
import type { ScheduleStatus } from "./schedule.model.js";

export type TimeWindow = {
  scheduledDate: Date;
  startAt: Date;
  endAt: Date;
  startTime: string;
  endTime: string;
};

export const activeScheduleStatuses: ScheduleStatus[] = ["SCHEDULED", "IN_PROGRESS", "RESCHEDULED"];
const editableScheduleStatuses = new Set<ScheduleStatus>(["SCHEDULED", "RESCHEDULED"]);
export const scheduleTerminalStatuses = new Set<ScheduleStatus>(["COMPLETED", "CANCELLED"]);

export const activeComplaintStatuses = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
]);

export const activeMaintenanceStatuses = new Set<MaintenanceStatus>([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "REJECTED",
]);

export const workloadComplaintStatuses: ComplaintStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

export const workloadMaintenanceStatuses: MaintenanceStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

export const assertTechnicianIsAssignable = (technician: { status: string }): void => {
  if (technician.status === "INACTIVE") {
    throw new AppError("Inactive technicians cannot be scheduled", 400);
  }

  if (technician.status === "ON_LEAVE") {
    throw new AppError("Technicians on leave cannot be scheduled", 400);
  }
};

export const assertScheduleEditable = (status: ScheduleStatus): void => {
  if (!editableScheduleStatuses.has(status)) {
    throw new AppError(`Schedule cannot be edited while it is ${status}`, 400);
  }
};

const parseScheduleDate = (value: string | Date): Date => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Scheduled date must be valid", 400);
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const parseTimeParts = (time: string): { hours: number; minutes: number } => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new AppError("Time must use HH:mm format", 400);
  }

  return { hours, minutes };
};

export const buildTimeWindow = (
  scheduledDate: string | Date,
  startTime: string,
  endTime: string
): TimeWindow => {
  const dateOnly = parseScheduleDate(scheduledDate);
  const startParts = parseTimeParts(startTime);
  const endParts = parseTimeParts(endTime);
  const startAt = new Date(dateOnly);
  const endAt = new Date(dateOnly);

  startAt.setHours(startParts.hours, startParts.minutes, 0, 0);
  endAt.setHours(endParts.hours, endParts.minutes, 0, 0);

  if (endAt <= startAt) {
    throw new AppError("End time must be after start time", 400);
  }

  return {
    scheduledDate: dateOnly,
    startAt,
    endAt,
    startTime,
    endTime,
  };
};

export const getDateBounds = (value: string | Date) => {
  const start = parseScheduleDate(value);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const createHistoryEntry = (
  status: ScheduleStatus,
  user: AuthenticatedScheduleUser,
  note?: string | null
) => ({
  status,
  note: normalizeOptionalString(note) ?? null,
  by: user.id,
  role: normalizeRole(user.role),
  createdAt: new Date(),
});

export const getNextTechnicianStatus = (
  scheduleCount: number,
  complaintCount: number,
  maintenanceCount: number
): TechnicianStatus => scheduleCount + complaintCount + maintenanceCount > 0 ? "BUSY" : "ACTIVE";
