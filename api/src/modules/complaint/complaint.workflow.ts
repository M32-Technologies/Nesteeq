import { AppError } from "../../utils/AppError.js";
import {
  complaintStatuses,
  type ComplaintDocument,
  type ComplaintStatus,
} from "./complaint.model.js";

const allowedStatusTransitions: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  PENDING: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WORK_COMPLETED", "AWAITING_APPROVAL", "CANCELLED"],
  WORK_COMPLETED: ["AWAITING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CLOSED"],
  REJECTED: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
  CLOSED: [],
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
]);

export const managerStatusUpdateTargets = new Set<ComplaintStatus>([
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
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
  nextStatus: ComplaintStatus
): void => {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(`Invalid status transition from ${currentStatus} to ${nextStatus}`, 400);
  }
};