import { AppError } from "../../utils/AppError.js";
import {
  complaintStatuses,
  type ComplaintDocument,
  type ComplaintStatus,
} from "./complaint.model.js";

const allowedStatusTransitions: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  PENDING: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "CANCELLED", "REJECTED"],
  UNDER_REVIEW: ["PENDING", "ASSIGNED", "IN_PROGRESS", "CANCELLED", "REJECTED"],
  ASSIGNED: ["PENDING", "IN_PROGRESS", "AWAITING_APPROVAL", "RESOLVED", "WORK_COMPLETED", "REJECTED", "CANCELLED", "CLOSED"],
  IN_PROGRESS: ["PENDING", "ASSIGNED", "WORK_COMPLETED", "RESOLVED", "AWAITING_APPROVAL", "CLOSED", "REJECTED", "CANCELLED"],
  RESOLVED: ["PENDING", "ASSIGNED", "IN_PROGRESS", "AWAITING_APPROVAL", "CLOSED", "REJECTED"],
  WORK_COMPLETED: ["AWAITING_APPROVAL", "APPROVED", "RESOLVED", "CLOSED", "REJECTED", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "RESOLVED", "CLOSED", "REJECTED", "IN_PROGRESS", "CANCELLED"],
  APPROVED: ["CLOSED", "RESOLVED"],
  REJECTED: ["PENDING", "ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: ["PENDING", "ASSIGNED", "IN_PROGRESS"],
  CLOSED: ["PENDING", "ASSIGNED", "IN_PROGRESS", "REJECTED"],
} satisfies Record<ComplaintStatus, ComplaintStatus[]>;

export const assignableStatuses = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
]);

export const completionAllowedStatuses = new Set<ComplaintStatus>([
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
]);

export const approvalAllowedStatuses = new Set<ComplaintStatus>([
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "RESOLVED",
]);

export const managerStatusUpdateTargets = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_APPROVAL",
  "RESOLVED",
  "WORK_COMPLETED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
]);

export const staffStatusUpdateTargets = new Set<ComplaintStatus>(["IN_PROGRESS"]);

const isComplaintStatus = (value: string): value is ComplaintStatus =>
  (complaintStatuses as readonly string[]).includes(value);

export const getComplaintStatus = (complaint: Pick<ComplaintDocument, "status">): ComplaintStatus => {
  if (!isComplaintStatus(complaint.status)) {
    throw new AppError("Complaint has an invalid status", 500);
  }

  return complaint.status;
};

export const assertNotTerminal = (complaint: ComplaintDocument): void => {
  const status = getComplaintStatus(complaint);

  if (status === "CLOSED") {
    throw new AppError("Complaint already closed", 400);
  }

  if (status === "CANCELLED") {
    throw new AppError("Complaint already cancelled", 400);
  }
};

export const assertValidTransition = (
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
  isManager: boolean = false
): void => {
  if (currentStatus === nextStatus) {
    return;
  }

  if (isManager) {
    return;
  }

  if (!allowedStatusTransitions[currentStatus]?.includes(nextStatus)) {
    throw new AppError(`Invalid status transition from ${currentStatus} to ${nextStatus}`, 400);
  }
};