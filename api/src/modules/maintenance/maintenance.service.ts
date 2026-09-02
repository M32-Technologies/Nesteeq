import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isManagementRole, isMaintenanceRole, normalizeRole } from "../../utils/role.js";
import { getMongoId, sameId } from "../../utils/serviceHelpers.js";
import { createNotification } from "../notification/notification.service.js";
import { Complaint, type ComplaintDocument } from "../complaint/complaint.model.js";
import {
  Maintenance,
  type MaintenanceDocument,
  type MaintenanceCostStatus,
} from "./maintenance.model.js";
import {
  activeMaintenanceStatuses,
  approvalAllowedStatuses,
  assertNotTerminal,
  assertValidTransition,
  assignableMaintenanceStatuses,
  complaintMaintenanceSourceStatuses,
  complaintTerminalStatuses,
  createComplaintRemark,
  createNote,
  createProgressUpdate,
  getComplaintStatus,
  getComplaintSyncForStatus,
  getMaintenanceStatus,
  managerStatusUpdateTargets,
  staffStatusUpdateTargets,
} from "./maintenance.workflow.js";
import {
  assertCanAccessMaintenance,
  assertManagerCanManageApartment,
  assertManagerCanManageMaintenance,
  assertStaffAssignedToMaintenance,
  buildRoleScopedFilter,
  ensureStaffCanWorkOnApartment,
} from "./maintenance.policy.js";
import type {
  ApproveMaintenanceInput,
  ApproveMaintenanceCostInput,
  AssignMaintenanceInput,
  CancelMaintenanceInput,
  CloseMaintenanceInput,
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  GetMaintenanceQuery,
  RejectMaintenanceInput,
  RejectMaintenanceCostInput,
  StartMaintenanceInput,
  UpdateMaintenanceInput,
  UpdateMaintenanceProgressInput,
  UpdateMaintenanceStatusInput,
} from "./maintenance.schema.js";

export type AuthenticatedMaintenanceUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
};

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  flatId?: string | null;
};

type ComplaintRemark = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

type MaintenancePush = Partial<{
  managerRemarks: unknown;
  workNotes: unknown;
  progressUpdates: unknown;
}>;

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

const findAuthUserById = async (userId: string): Promise<AuthUserRecord | null> =>
  getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(userId) });

const ensureCurrentUserExists = async (
  user: AuthenticatedMaintenanceUser
): Promise<AuthUserRecord> => {
  const existingUser = await findAuthUserById(user.id);

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }

  return existingUser;
};

const ensureStaffUser = async (staffId: string): Promise<AuthUserRecord> => {
  const staff = await findAuthUserById(staffId);

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  if (!staff.role || !isMaintenanceRole(staff.role)) {
    throw new AppError("Assigned user must be maintenance staff", 400);
  }

  return staff;
};

const assertValidMaintenanceId = (maintenanceId: string): void => {
  if (!Types.ObjectId.isValid(maintenanceId)) {
    throw new AppError("Invalid maintenance ID", 400);
  }
};

const assertValidComplaintId = (complaintId: string): void => {
  if (!Types.ObjectId.isValid(complaintId)) {
    throw new AppError("Invalid complaint ID", 400);
  }
};

const getMaintenanceOrThrow = async (maintenanceId: string) => {
  assertValidMaintenanceId(maintenanceId);

  const maintenance = await Maintenance.findById(maintenanceId);

  if (!maintenance) {
    throw new AppError("Maintenance not found", 404);
  }

  return maintenance;
};

const getComplaintOrThrow = async (complaintId: string) => {
  assertValidComplaintId(complaintId);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
};

const updateMaintenanceDocument = async (
  maintenanceId: string,
  set: Record<string, unknown>,
  push?: MaintenancePush
) => {
  const update: UpdateQuery<MaintenanceDocument> = {};

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  if (push && Object.keys(push).length > 0) {
    update.$push = push;
  }

  const updatedMaintenance = await Maintenance.findByIdAndUpdate(maintenanceId, update, {
    new: true,
    runValidators: true,
  });

  if (!updatedMaintenance) {
    throw new AppError("Maintenance not found", 404);
  }

  return updatedMaintenance;
};

const syncComplaint = async (
  complaintId: string,
  set: Record<string, unknown>,
  remark?: ComplaintRemark | null
): Promise<void> => {
  const update: UpdateQuery<ComplaintDocument> = {};

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  if (remark) {
    update.$push = { remarks: remark };
  }

  if (Object.keys(update).length === 0) {
    return;
  }

  await Complaint.findByIdAndUpdate(complaintId, update, {
    runValidators: true,
  });
};

const syncComplaintFromMaintenance = async (
  maintenance: MaintenanceDocument,
  set: Record<string, unknown>,
  user: AuthenticatedMaintenanceUser,
  remark?: string
): Promise<void> => {
  const complaintId = getMongoId(maintenance.complaint);
  assertValidComplaintId(complaintId);

  await syncComplaint(complaintId, set, createComplaintRemark(remark, user));
};

export const createMaintenance = async (
  data: CreateMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  if (!isManagementRole(user.role)) {
    throw new AppError("Only management users can create maintenance work", 403);
  }

  const complaint = await getComplaintOrThrow(data.complaint);
  const complaintStatus = getComplaintStatus(complaint);

  if (complaintTerminalStatuses.has(complaintStatus) || !complaintMaintenanceSourceStatuses.has(complaintStatus)) {
    throw new AppError(`Complaint cannot be used for maintenance while it is ${complaintStatus}`, 400);
  }

  assertManagerCanManageApartment(user, complaint.apartment);

  const existingActiveMaintenance = await Maintenance.findOne({
    complaint: data.complaint,
    status: { $in: activeMaintenanceStatuses },
  }).lean();

  if (existingActiveMaintenance) {
    throw new AppError("An active maintenance record already exists for this complaint", 409);
  }

  let assignedStaff: string | null = null;
  const now = new Date();

  if (data.assignedStaff) {
    const staff = await ensureStaffUser(data.assignedStaff);
    assignedStaff = ensureStaffCanWorkOnApartment(staff, data.assignedStaff, complaint.apartment, user);
  }

  const maintenance = await Maintenance.create({
    complaint: complaint._id,
    resident: complaint.resident,
    apartment: complaint.apartment,
    flat: complaint.flat,
    assignedStaff,
    category: data.category ?? complaint.category,
    title: data.title ?? complaint.title,
    description: data.description ?? complaint.description,
    priority: data.priority ?? complaint.priority,
    status: assignedStaff ? "ASSIGNED" : "PENDING",
    assignedBy: assignedStaff ? user.id : null,
    assignedAt: assignedStaff ? now : null,
    estimatedCost: data.estimatedCost ?? complaint.estimatedCost ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  });

  const complaintSet: Record<string, unknown> = assignedStaff
    ? {
        status: "ASSIGNED",
        assignedStaff,
        assignedBy: user.id,
        assignedAt: now,
        estimatedCost: data.estimatedCost ?? complaint.estimatedCost ?? null,
      }
    : complaintStatus === "PENDING"
      ? { status: "UNDER_REVIEW" }
      : {};

  await syncComplaint(
    data.complaint,
    complaintSet,
    createComplaintRemark(data.remarks, user)
  );

  if (assignedStaff) {
    await createNotification({
      apartment: maintenance.apartment,
      recipientUserId: assignedStaff,
      type: "TASK_ASSIGNED",
      severity: maintenance.priority === "URGENT" ? "WARNING" : "INFO",
      title: "Maintenance work assigned",
      message: `${maintenance.title} has been assigned to you.`,
      relatedResourceType: "maintenance",
      relatedResourceId: String(maintenance._id),
      createdBy: user.id,
    });
  }

  return maintenance;
};

export const getMaintenance = async (
  query: GetMaintenanceQuery,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const filter = buildRoleScopedFilter(query, user);
  const skip = (query.page - 1) * query.limit;

  const [maintenance, total] = await Promise.all([
    Maintenance.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Maintenance.countDocuments(filter),
  ]);

  return {
    maintenance,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getMaintenanceById = async (
  maintenanceId: string,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertCanAccessMaintenance(user, maintenance);

  return maintenance;
};

export const updateMaintenance = async (
  maintenanceId: string,
  data: UpdateMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const set: Record<string, unknown> = {
    updatedBy: user.id,
  };
  const complaintSet: Record<string, unknown> = {};

  if (data.category !== undefined) {
    set.category = data.category;
    complaintSet.category = data.category;
  }

  if (data.title !== undefined) {
    set.title = data.title;
    complaintSet.title = data.title;
  }

  if (data.description !== undefined) {
    set.description = data.description;
    complaintSet.description = data.description;
  }

  if (data.priority !== undefined) {
    set.priority = data.priority;
    complaintSet.priority = data.priority;
  }

  if (data.estimatedCost !== undefined) {
    set.estimatedCost = data.estimatedCost;
    complaintSet.estimatedCost = data.estimatedCost;
  }

  const managerRemark = createNote(data.managerRemarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  await syncComplaintFromMaintenance(updatedMaintenance, complaintSet, user, data.managerRemarks);

  return updatedMaintenance;
};

export const assignMaintenance = async (
  maintenanceId: string,
  data: AssignMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (!assignableMaintenanceStatuses.has(currentStatus)) {
    throw new AppError(`Maintenance cannot be assigned while it is ${currentStatus}`, 400);
  }

  const staff = await ensureStaffUser(data.assignedStaff);
  const staffId = ensureStaffCanWorkOnApartment(staff, data.assignedStaff, maintenance.apartment, user);

  if (currentStatus === "ASSIGNED" && sameId(maintenance.assignedStaff, staffId)) {
    throw new AppError("Maintenance is already assigned to this staff member", 409);
  }

  const now = new Date();
  const set: Record<string, unknown> = {
    assignedStaff: staffId,
    assignedBy: user.id,
    assignedAt: now,
    status: "ASSIGNED",
    updatedBy: user.id,
  };

  if (data.estimatedCost !== undefined) {
    set.estimatedCost = data.estimatedCost;
  }

  const managerRemark = createNote(data.remarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  const complaintSet: Record<string, unknown> = {
    status: "ASSIGNED",
    assignedStaff: staffId,
    assignedBy: user.id,
    assignedAt: now,
  };

  if (data.estimatedCost !== undefined) {
    complaintSet.estimatedCost = data.estimatedCost;
  }

  await syncComplaintFromMaintenance(updatedMaintenance, complaintSet, user, data.remarks);

  await createNotification({
    apartment: updatedMaintenance.apartment,
    recipientUserId: staffId,
    type: "TASK_ASSIGNED",
    severity: updatedMaintenance.priority === "URGENT" ? "WARNING" : "INFO",
    title: "Maintenance work assigned",
    message: `${updatedMaintenance.title} has been assigned to you.`,
    relatedResourceType: "maintenance",
    relatedResourceId: maintenanceId,
    createdBy: user.id,
  });

  return updatedMaintenance;
};

export const updateMaintenanceStatus = async (
  maintenanceId: string,
  data: UpdateMaintenanceStatusInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertCanAccessMaintenance(user, maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);
  const nextStatus = data.status;

  if (currentStatus === nextStatus) {
    return maintenance;
  }

  assertNotTerminal(maintenance);
  assertValidTransition(currentStatus, nextStatus);

  if (isMaintenanceRole(user.role)) {
    assertStaffAssignedToMaintenance(user, maintenance);

    if (!staffStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Maintenance staff can only move assigned work in or out of progress", 403);
    }
  } else if (isManagementRole(user.role)) {
    assertManagerCanManageMaintenance(user, maintenance);

    if (!managerStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Use the dedicated workflow endpoint for this status update", 400);
    }
  } else {
    throw new AppError("You do not have permission to update maintenance status", 403);
  }

  if ((nextStatus === "ASSIGNED" || nextStatus === "IN_PROGRESS") && !maintenance.assignedStaff) {
    throw new AppError("Assign maintenance staff before moving this work forward", 400);
  }

  const set: Record<string, unknown> = {
    status: nextStatus,
    updatedBy: user.id,
  };

  if (nextStatus === "IN_PROGRESS" && !maintenance.startedAt) {
    set.startedAt = new Date();
  }

  const note = createNote(data.remarks, user);
  const push = note
    ? isMaintenanceRole(user.role)
      ? { workNotes: note }
      : { managerRemarks: note }
    : undefined;

  const updatedMaintenance = await updateMaintenanceDocument(maintenanceId, set, push);
  const complaintSet = getComplaintSyncForStatus(updatedMaintenance, nextStatus, user);

  await syncComplaintFromMaintenance(updatedMaintenance, complaintSet, user, data.remarks);

  return updatedMaintenance;
};

export const startMaintenance = async (
  maintenanceId: string,
  data: StartMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertCanAccessMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  if (isMaintenanceRole(user.role)) {
    assertStaffAssignedToMaintenance(user, maintenance);
  } else if (isManagementRole(user.role)) {
    assertManagerCanManageMaintenance(user, maintenance);
  } else {
    throw new AppError("You do not have permission to start maintenance", 403);
  }

  if (!maintenance.assignedStaff) {
    throw new AppError("Assign maintenance staff before starting work", 400);
  }

  const currentStatus = getMaintenanceStatus(maintenance);

  if (currentStatus === "IN_PROGRESS") {
    return maintenance;
  }

  assertValidTransition(currentStatus, "IN_PROGRESS");

  const now = new Date();
  const progressUpdate = createProgressUpdate(
    data.remarks ?? "Maintenance work started",
    "IN_PROGRESS",
    data.remarks,
    user
  );

  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    {
      status: "IN_PROGRESS",
      startedAt: maintenance.startedAt ?? now,
      updatedBy: user.id,
    },
    { progressUpdates: progressUpdate }
  );

  await syncComplaintFromMaintenance(
    updatedMaintenance,
    { status: "IN_PROGRESS" },
    user,
    data.remarks
  );

  return updatedMaintenance;
};

export const updateMaintenanceProgress = async (
  maintenanceId: string,
  data: UpdateMaintenanceProgressInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertCanAccessMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  if (isMaintenanceRole(user.role)) {
    assertStaffAssignedToMaintenance(user, maintenance);
  } else if (isManagementRole(user.role)) {
    assertManagerCanManageMaintenance(user, maintenance);
  } else {
    throw new AppError("You do not have permission to update maintenance progress", 403);
  }

  const currentStatus = getMaintenanceStatus(maintenance);

  if (approvalAllowedStatuses.has(currentStatus) || currentStatus === "APPROVED") {
    throw new AppError("Maintenance progress cannot be updated after work is submitted for review", 400);
  }

  const nextStatus = data.status ?? (currentStatus === "ASSIGNED" || currentStatus === "REJECTED" ? "IN_PROGRESS" : currentStatus);

  if (!staffStatusUpdateTargets.has(nextStatus)) {
    throw new AppError("Progress can only move maintenance to IN_PROGRESS or ON_HOLD", 400);
  }

  assertValidTransition(currentStatus, nextStatus);

  const set: Record<string, unknown> = {
    status: nextStatus,
    updatedBy: user.id,
  };

  if (nextStatus === "IN_PROGRESS" && !maintenance.startedAt) {
    set.startedAt = new Date();
  }

  const progressUpdate = createProgressUpdate(
    data.progressDetails,
    nextStatus,
    data.remarks,
    user
  );

  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    { progressUpdates: progressUpdate }
  );

  if (nextStatus === "IN_PROGRESS" || nextStatus === "ON_HOLD") {
    await syncComplaintFromMaintenance(
      updatedMaintenance,
      { status: "IN_PROGRESS" },
      user,
      data.remarks
    );
  }

  await createNotification({
    apartment: updatedMaintenance.apartment,
    recipientRole: "FACILITY_MANAGER",
    type: "MAINTENANCE_STATUS_UPDATED",
    severity: nextStatus === "ON_HOLD" ? "WARNING" : "INFO",
    title: "Maintenance progress updated",
    message: `${updatedMaintenance.title} was updated to ${nextStatus.toLowerCase().replace("_", " ")}.`,
    relatedResourceType: "maintenance",
    relatedResourceId: maintenanceId,
    createdBy: user.id,
  });

  return updatedMaintenance;
};

export const completeMaintenance = async (
  maintenanceId: string,
  data: CompleteMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertStaffAssignedToMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (currentStatus === "AWAITING_APPROVAL" || currentStatus === "WORK_COMPLETED") {
    throw new AppError("Maintenance work has already been submitted for approval", 400);
  }

  if (currentStatus === "APPROVED") {
    throw new AppError("Maintenance work has already been approved", 400);
  }

  assertValidTransition(currentStatus, "AWAITING_APPROVAL");

  const now = new Date();
  const set: Record<string, unknown> = {
    status: "AWAITING_APPROVAL",
    completedAt: now,
    completionDetails: {
      details: data.completionDetails,
      workNotes: data.workNotes ?? null,
      completedBy: user.id,
      completedAt: now,
    },
    updatedBy: user.id,
  };

  if (data.finalCost !== undefined) {
    set.finalCost = data.finalCost;
    set.costReview = {
      status: "SUBMITTED" satisfies MaintenanceCostStatus,
      submittedAmount: data.finalCost,
      submittedBy: user.id,
      submittedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      remarks: null,
      rejectionReason: null,
      forwardedToRole: null,
      forwardedAt: null,
    };
  }

  const workNote = createNote(data.workNotes ?? data.remarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    workNote ? { workNotes: workNote } : undefined
  );

  const complaintSet: Record<string, unknown> = {
    status: "AWAITING_APPROVAL",
    completionDetails: {
      details: data.completionDetails,
      completedBy: user.id,
      completedAt: now,
    },
  };

  if (data.finalCost !== undefined) {
    complaintSet.finalCost = data.finalCost;
  }

  await syncComplaintFromMaintenance(updatedMaintenance, complaintSet, user, data.remarks);

  await createNotification({
    apartment: updatedMaintenance.apartment,
    recipientRole: "FACILITY_MANAGER",
    type: data.finalCost !== undefined ? "COST_SUBMITTED" : "WORK_COMPLETED",
    severity: "INFO",
    title: data.finalCost !== undefined ? "Maintenance cost submitted" : "Maintenance work completed",
    message:
      data.finalCost !== undefined
        ? `${updatedMaintenance.title} was completed with a submitted cost.`
        : `${updatedMaintenance.title} was submitted for review.`,
    relatedResourceType: "maintenance",
    relatedResourceId: maintenanceId,
    createdBy: user.id,
  });

  return updatedMaintenance;
};

export const approveMaintenance = async (
  maintenanceId: string,
  data: ApproveMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed maintenance awaiting approval can be approved", 400);
  }

  const now = new Date();
  const set: Record<string, unknown> = {
    status: "APPROVED",
    approvalDetails: {
      status: "APPROVED",
      reviewedBy: user.id,
      reviewedAt: now,
      remarks: data.remarks ?? null,
      rejectionReason: null,
    },
    updatedBy: user.id,
  };

  const managerRemark = createNote(data.remarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  await syncComplaintFromMaintenance(
    updatedMaintenance,
    {
      status: "APPROVED",
      approvalDetails: {
        status: "APPROVED",
        reviewedBy: user.id,
        reviewedAt: now,
        remarks: data.remarks ?? null,
        rejectionReason: null,
      },
      residentConfirmation: {
        status: "PENDING",
        requestedAt: now,
        confirmedBy: null,
        confirmedAt: null,
        remarks: null,
      },
    },
    user,
    data.remarks
  );

  await Promise.all([
    createNotification({
      apartment: updatedMaintenance.apartment,
      recipientUserId: updatedMaintenance.resident,
      type: "RESIDENT_CONFIRMATION_REQUESTED",
      severity: "INFO",
      title: "Maintenance work ready for confirmation",
      message: `${updatedMaintenance.title} has been approved and is waiting for your confirmation.`,
      relatedResourceType: "maintenance",
      relatedResourceId: maintenanceId,
      createdBy: user.id,
    }),
    updatedMaintenance.assignedStaff
      ? createNotification({
          apartment: updatedMaintenance.apartment,
          recipientUserId: updatedMaintenance.assignedStaff,
          type: "WORK_COMPLETED",
          severity: "SUCCESS",
          title: "Maintenance work approved",
          message: `${updatedMaintenance.title} was approved by the Facility Manager.`,
          relatedResourceType: "maintenance",
          relatedResourceId: maintenanceId,
          createdBy: user.id,
        })
      : Promise.resolve(),
  ]);

  return updatedMaintenance;
};

export const rejectMaintenance = async (
  maintenanceId: string,
  data: RejectMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed maintenance awaiting approval can be rejected", 400);
  }

  const now = new Date();
  const set: Record<string, unknown> = {
    status: "REJECTED",
    approvalDetails: {
      status: "REJECTED",
      reviewedBy: user.id,
      reviewedAt: now,
      remarks: data.remarks ?? null,
      rejectionReason: data.reason,
    },
    updatedBy: user.id,
  };

  const managerRemark = createNote(data.reason, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  await syncComplaintFromMaintenance(
    updatedMaintenance,
    {
      status: "REJECTED",
      approvalDetails: {
        status: "REJECTED",
        reviewedBy: user.id,
        reviewedAt: now,
        remarks: data.remarks ?? null,
        rejectionReason: data.reason,
      },
    },
    user,
    data.reason
  );

  if (updatedMaintenance.assignedStaff) {
    await createNotification({
      apartment: updatedMaintenance.apartment,
      recipientUserId: updatedMaintenance.assignedStaff,
      type: "MAINTENANCE_STATUS_UPDATED",
      severity: "WARNING",
      title: "Maintenance work rejected",
      message: `${updatedMaintenance.title} needs more work: ${data.reason}`,
      relatedResourceType: "maintenance",
      relatedResourceId: maintenanceId,
      createdBy: user.id,
    });
  }

  return updatedMaintenance;
};

export const cancelMaintenance = async (
  maintenanceId: string,
  data: CancelMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (currentStatus === "APPROVED") {
    throw new AppError("Approved maintenance should be closed instead of cancelled", 400);
  }

  assertValidTransition(currentStatus, "CANCELLED");

  const now = new Date();
  const set: Record<string, unknown> = {
    status: "CANCELLED",
    cancellationReason: data.reason ?? null,
    cancelledBy: user.id,
    cancelledAt: now,
    updatedBy: user.id,
  };

  const managerRemark = createNote(data.reason, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    set,
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  await syncComplaintFromMaintenance(
    updatedMaintenance,
    {
      status: "CANCELLED",
      cancelledBy: user.id,
      cancelledAt: now,
      cancellationReason: data.reason ?? null,
    },
    user,
    data.reason
  );

  return updatedMaintenance;
};

export const closeMaintenance = async (
  maintenanceId: string,
  data: CloseMaintenanceInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);
  assertNotTerminal(maintenance);

  const currentStatus = getMaintenanceStatus(maintenance);

  if (currentStatus !== "APPROVED") {
    throw new AppError("Maintenance can only be closed after approval", 400);
  }

  assertValidTransition(currentStatus, "CLOSED");

  const now = new Date();
  const managerRemark = createNote(data.remarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    {
      status: "CLOSED",
      closedBy: user.id,
      closedAt: now,
      updatedBy: user.id,
    },
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  const relatedComplaint = await Complaint.findById(getMongoId(updatedMaintenance.complaint));

  if (relatedComplaint?.residentConfirmation?.status === "CONFIRMED") {
    await syncComplaintFromMaintenance(
      updatedMaintenance,
      {
        status: "CLOSED",
        closedBy: user.id,
        closedAt: now,
      },
      user,
      data.remarks
    );
  }

  return updatedMaintenance;
};

export const approveMaintenanceCost = async (
  maintenanceId: string,
  data: ApproveMaintenanceCostInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);

  const costStatus = maintenance.costReview?.status ?? "NOT_SUBMITTED";

  if (costStatus !== "SUBMITTED") {
    throw new AppError("Only submitted maintenance costs can be approved", 400);
  }

  const submittedAmount = maintenance.costReview?.submittedAmount ?? maintenance.finalCost;

  if (submittedAmount === null || submittedAmount === undefined) {
    throw new AppError("Submitted cost amount is missing", 400);
  }

  const now = new Date();
  const managerRemark = createNote(data.remarks, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    {
      costReview: {
        status: "APPROVED",
        submittedAmount,
        submittedBy: maintenance.costReview?.submittedBy ?? maintenance.assignedStaff ?? null,
        submittedAt: maintenance.costReview?.submittedAt ?? maintenance.completedAt ?? now,
        reviewedBy: user.id,
        reviewedAt: now,
        remarks: data.remarks ?? null,
        rejectionReason: null,
        forwardedToRole: "TREASURER",
        forwardedAt: now,
      },
      updatedBy: user.id,
    },
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  await Promise.all([
    createNotification({
      apartment: updatedMaintenance.apartment,
      recipientRole: "TREASURER",
      type: "COST_APPROVED",
      severity: "INFO",
      title: "Maintenance charge approved",
      message: `${updatedMaintenance.title} has an approved maintenance charge ready for financial processing.`,
      relatedResourceType: "maintenance",
      relatedResourceId: maintenanceId,
      createdBy: user.id,
    }),
    updatedMaintenance.assignedStaff
      ? createNotification({
          apartment: updatedMaintenance.apartment,
          recipientUserId: updatedMaintenance.assignedStaff,
          type: "COST_APPROVED",
          severity: "SUCCESS",
          title: "Submitted cost approved",
          message: `${updatedMaintenance.title} cost was approved by the Facility Manager.`,
          relatedResourceType: "maintenance",
          relatedResourceId: maintenanceId,
          createdBy: user.id,
        })
      : Promise.resolve(),
  ]);

  return updatedMaintenance;
};

export const rejectMaintenanceCost = async (
  maintenanceId: string,
  data: RejectMaintenanceCostInput,
  user: AuthenticatedMaintenanceUser
) => {
  await ensureCurrentUserExists(user);

  const maintenance = await getMaintenanceOrThrow(maintenanceId);
  assertManagerCanManageMaintenance(user, maintenance);

  const costStatus = maintenance.costReview?.status ?? "NOT_SUBMITTED";

  if (costStatus !== "SUBMITTED") {
    throw new AppError("Only submitted maintenance costs can be rejected", 400);
  }

  const now = new Date();
  const managerRemark = createNote(data.reason, user);
  const updatedMaintenance = await updateMaintenanceDocument(
    maintenanceId,
    {
      costReview: {
        status: "REJECTED",
        submittedAmount: maintenance.costReview?.submittedAmount ?? maintenance.finalCost ?? null,
        submittedBy: maintenance.costReview?.submittedBy ?? maintenance.assignedStaff ?? null,
        submittedAt: maintenance.costReview?.submittedAt ?? maintenance.completedAt ?? now,
        reviewedBy: user.id,
        reviewedAt: now,
        remarks: data.remarks ?? null,
        rejectionReason: data.reason,
        forwardedToRole: null,
        forwardedAt: null,
      },
      updatedBy: user.id,
    },
    managerRemark ? { managerRemarks: managerRemark } : undefined
  );

  if (updatedMaintenance.assignedStaff) {
    await createNotification({
      apartment: updatedMaintenance.apartment,
      recipientUserId: updatedMaintenance.assignedStaff,
      type: "COST_REJECTED",
      severity: "WARNING",
      title: "Submitted cost rejected",
      message: `${updatedMaintenance.title} cost was rejected: ${data.reason}`,
      relatedResourceType: "maintenance",
      relatedResourceId: maintenanceId,
      createdBy: user.id,
    });
  }

  return updatedMaintenance;
};
