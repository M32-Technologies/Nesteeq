import { AppError } from "../../utils/AppError.js";
import { normalizeRole } from "../../utils/role.js";
import { normalizeOptionalString } from "../../utils/serviceHelpers.js";
import {
  complaintStatuses,
  type ComplaintDocument,
  type ComplaintStatus,
} from "../complaint/complaint.model.js";
import type { AuthenticatedMaintenanceUser } from "./maintenance.service.js";
import {
  maintenanceStatuses,
  type MaintenanceDocument,
  type MaintenanceStatus,
} from "./maintenance.model.js";

export type MaintenanceNote = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

export type MaintenanceProgressUpdate = {
  details: string;
  status: MaintenanceStatus;
  remarks: string | null;
  by: string;
  role: string;
  createdAt: Date;
};

export type MaintenancePush = {
  progressUpdates?: MaintenanceProgressUpdate;
  workNotes?: MaintenanceNote;
  managerRemarks?: MaintenanceNote;
};

export type ComplaintRemark = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

export const terminalStatuses = new Set<MaintenanceStatus>(["CANCELLED", "CLOSED"]);
export const complaintTerminalStatuses = new Set<ComplaintStatus>(["APPROVED", "CANCELLED", "CLOSED"]);
export const complaintMaintenanceSourceStatuses = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
]);

const allowedStatusTransitions: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "AWAITING_APPROVAL", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  WORK_COMPLETED: ["AWAITING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CLOSED"],
  REJECTED: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
  CLOSED: [],
};

export const assignableMaintenanceStatuses = new Set<MaintenanceStatus>([
  "PENDING",
  "ASSIGNED",
  "ON_HOLD",
  "REJECTED",
]);

export const activeMaintenanceStatuses: MaintenanceStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

export const managerStatusUpdateTargets = new Set<MaintenanceStatus>([
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
]);

export const staffStatusUpdateTargets = new Set<MaintenanceStatus>(["IN_PROGRESS", "ON_HOLD"]);
export const approvalAllowedStatuses = new Set<MaintenanceStatus>(["WORK_COMPLETED", "AWAITING_APPROVAL"]);

const isMaintenanceStatus = (value: string): value is MaintenanceStatus =>
  (maintenanceStatuses as readonly string[]).includes(value);

const isComplaintStatus = (value: string): value is ComplaintStatus =>
  (complaintStatuses as readonly string[]).includes(value);

export const getMaintenanceStatus = (maintenance: Pick<MaintenanceDocument, "status">): MaintenanceStatus => {
  if (!isMaintenanceStatus(maintenance.status)) {
    throw new AppError("Maintenance has an invalid status", 500);
  }

  return maintenance.status;
};

export const getComplaintStatus = (complaint: Pick<ComplaintDocument, "status">): ComplaintStatus => {
  if (!isComplaintStatus(complaint.status)) {
    throw new AppError("Complaint has an invalid status", 500);
  }

  return complaint.status;
};

export const assertValidTransition = (
  currentStatus: MaintenanceStatus,
  nextStatus: MaintenanceStatus
): void => {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(`Invalid status transition from ${currentStatus} to ${nextStatus}`, 400);
  }
};

export const assertNotTerminal = (maintenance: MaintenanceDocument): void => {
  const status = getMaintenanceStatus(maintenance);

  if (status === "CLOSED") {
    throw new AppError("Maintenance already closed", 400);
  }

  if (status === "CANCELLED") {
    throw new AppError("Maintenance already cancelled", 400);
  }
};

export const createNote = (
  message: string | undefined,
  user: AuthenticatedMaintenanceUser
): MaintenanceNote | null => {
  const normalizedMessage = normalizeOptionalString(message);

  if (!normalizedMessage) {
    return null;
  }

  return {
    message: normalizedMessage,
    by: user.id,
    role: normalizeRole(user.role),
    createdAt: new Date(),
  };
};

export const createComplaintRemark = (
  message: string | undefined,
  user: AuthenticatedMaintenanceUser
): ComplaintRemark | null => {
  const normalizedMessage = normalizeOptionalString(message);

  if (!normalizedMessage) {
    return null;
  }

  return {
    message: normalizedMessage,
    by: user.id,
    role: normalizeRole(user.role),
    createdAt: new Date(),
  };
};

export const createProgressUpdate = (
  details: string,
  status: MaintenanceStatus,
  remarks: string | undefined,
  user: AuthenticatedMaintenanceUser
): MaintenanceProgressUpdate => ({
  details,
  status,
  remarks: normalizeOptionalString(remarks),
  by: user.id,
  role: normalizeRole(user.role),
  createdAt: new Date(),
});

export const getComplaintSyncForStatus = (
  maintenance: MaintenanceDocument,
  nextStatus: MaintenanceStatus,
  user: AuthenticatedMaintenanceUser
): Record<string, unknown> => {
  if (nextStatus === "ASSIGNED") {
    return {
      status: "ASSIGNED",
      assignedStaff: maintenance.assignedStaff,
      assignedBy: user.id,
      assignedAt: new Date(),
    };
  }

  if (nextStatus === "IN_PROGRESS" || nextStatus === "ON_HOLD") {
    return {
      status: "IN_PROGRESS",
    };
  }

  return {};
};
