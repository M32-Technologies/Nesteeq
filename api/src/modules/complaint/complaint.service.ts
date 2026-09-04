import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  isGlobalRole as isGlobalManagementRole,
  isManagementRole,
  isMaintenanceRole,
  isResidentRole,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  normalizeRole,
  RESIDENT_ROLE_SET as residentRoles,
} from "../../utils/role.js";
const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const sameId = (id1: any, id2: any): boolean => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

import { Complaint, type ComplaintDocument } from "./complaint.model.js";
import {
  approvalAllowedStatuses,
  assertNotTerminal,
  assertValidTransition,
  assignableStatuses,
  completionAllowedStatuses,
  getComplaintStatus,
  managerStatusUpdateTargets,
  staffStatusUpdateTargets,
} from "./complaint.workflow.js";
import {
  assertCanAccessComplaint,
  assertManagerCanManageComplaint,
  assertStaffAssignedToComplaint,
} from "./complaint.policy.js";
import type {
  ApproveComplaintInput,
  AssignComplaintInput,
  CancelComplaintInput,
  ConfirmComplaintResolutionInput,
  CompleteComplaintWorkInput,
  CreateComplaintInput,
  GetComplaintsQuery,
  RejectComplaintInput,
  UpdateComplaintInput,
  UpdateComplaintStatusInput,
} from "./compliaint.schema.js";

export type AuthenticatedComplaintUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
};

type ComplaintRemark = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

type ComplaintFilter = Record<string, unknown>;

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  flatId?: string | null;
};

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

const findAuthUserById = async (userId: string): Promise<AuthUserRecord | null> => {
  const filters = buildAuthUserIdFilters(userId);

  return getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: filters });
};

const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

const ensureCurrentUserExists = async (
  user: AuthenticatedComplaintUser
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

const assertValidComplaintId = (complaintId: string): void => {
  if (!Types.ObjectId.isValid(complaintId)) {
    throw new AppError("Invalid complaint ID", 400);
  }
};

const getComplaintOrThrow = async (complaintId: string) => {
  assertValidComplaintId(complaintId);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
};

const updateComplaintDocument = async (
  complaintId: string,
  set: Record<string, unknown>,
  remark?: ComplaintRemark | null
) => {
  const update: UpdateQuery<ComplaintDocument> = {};

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  if (remark) {
    update.$push = { remarks: remark };
  }

  const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, update, {
    new: true,
    runValidators: true,
  });

  if (!updatedComplaint) {
    throw new AppError("Complaint not found", 404);
  }

  return updatedComplaint;
};

const createRemark = (message: string | undefined, user: AuthenticatedComplaintUser): ComplaintRemark | null => {
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

const applySharedFilters = (
  filter: ComplaintFilter,
  query: GetComplaintsQuery
): void => {
  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }
};

const applyManagerFilters = (
  filter: ComplaintFilter,
  query: GetComplaintsQuery,
  user: AuthenticatedComplaintUser
): void => {
  const role = normalizeRole(user.role);
  const managerApartmentId = normalizeOptionalString(user.apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      filter._id = { $in: [] };
      return;
    }

    if (query.apartment && query.apartment !== managerApartmentId) {
      throw new AppError("You do not have permission to view complaints for this apartment", 403);
    }

    filter.apartment = managerApartmentId;
  } else if (query.apartment) {
    filter.apartment = query.apartment;
  }

  if (query.flat) {
    filter.flat = query.flat;
  }

  if (query.resident) {
    filter.resident = query.resident;
  }

  if (query.assignedStaff) {
    filter.assignedStaff = query.assignedStaff;
  }
};

export const createComplaint = async (
  data: CreateComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  if (!isResidentRole(user.role)) {
    throw new AppError("Only residents can create complaints", 403);
  }

  const apartment = normalizeOptionalString(user.apartmentId);
  const flat = normalizeOptionalString(user.flatId);

  if (!apartment || !flat) {
    throw new AppError("Resident must be linked to an apartment and flat before creating a complaint", 400);
  }

  const complaint = await Complaint.create({
    resident: user.id,
    apartment,
    flat,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: "PENDING",
  });



  return complaint;
};

export const getComplaints = async (
  query: GetComplaintsQuery,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const role = normalizeRole(user.role);
  const filter: ComplaintFilter = {};

  applySharedFilters(filter, query);

  if (managementRoles.has(role)) {
    applyManagerFilters(filter, query, user);
  } else if (maintenanceRoles.has(role)) {
    filter.assignedStaff = user.id;
  } else if (residentRoles.has(role)) {
    filter.resident = user.id;
  } else {
    throw new AppError("You do not have permission to access complaints", 403);
  }

  const skip = (query.page - 1) * query.limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Complaint.countDocuments(filter),
  ]);

  return {
    complaints,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getComplaintById = async (
  complaintId: string,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);

  return complaint;
};

export const updateComplaint = async (
  complaintId: string,
  data: UpdateComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);
  assertNotTerminal(complaint);

  const role = normalizeRole(user.role);
  const status = getComplaintStatus(complaint);
  const set: Record<string, unknown> = {};

  if (residentRoles.has(role) && !["PENDING", "UNDER_REVIEW"].includes(status)) {
    throw new AppError("Residents can only edit complaints before they are assigned", 400);
  }

  if (residentRoles.has(role) && data.estimatedCost !== undefined) {
    throw new AppError("Residents cannot update complaint costs", 403);
  }

  if (data.title !== undefined) {
    set.title = data.title;
  }

  if (data.description !== undefined) {
    set.description = data.description;
  }

  if (data.category !== undefined) {
    set.category = data.category;
  }

  if (data.priority !== undefined) {
    set.priority = data.priority;
  }

  if (data.estimatedCost !== undefined) {
    if (!managementRoles.has(role)) {
      throw new AppError("Only management users can update estimated cost", 403);
    }

    set.estimatedCost = data.estimatedCost;
  }

  return updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));
};

export const assignComplaint = async (
  complaintId: string,
  data: AssignComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!assignableStatuses.has(currentStatus)) {
    throw new AppError(`Complaint cannot be assigned while it is ${currentStatus}`, 400);
  }

  const staff = await ensureStaffUser(data.assignedStaff);
  const staffId = getAuthUserId(staff, data.assignedStaff);
  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const staffApartmentId = normalizeOptionalString(staff.apartmentId);
  const complaintApartmentId = normalizeOptionalString(complaint.apartment);
  const isGlobalManager = isGlobalManagementRole(user.role);

  if (!isGlobalManager) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (!staffApartmentId || staffApartmentId !== managerApartmentId) {
      throw new AppError("Staff member does not belong to your apartment", 403);
    }
  }

  if (staffApartmentId && staffApartmentId !== complaintApartmentId) {
    throw new AppError("Staff member does not belong to the complaint apartment", 400);
  }

  const set: Record<string, unknown> = {
    assignedStaff: staffId,
    assignedBy: user.id,
    assignedAt: new Date(),
    status: "ASSIGNED",
  };

  if (data.estimatedCost !== undefined) {
    set.estimatedCost = data.estimatedCost;
  }

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));



  return updatedComplaint;
};

export const updateComplaintStatus = async (
  complaintId: string,
  data: UpdateComplaintStatusInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);

  const currentStatus = getComplaintStatus(complaint);
  const nextStatus = data.status;

  if (currentStatus === nextStatus) {
    return complaint;
  }

  assertNotTerminal(complaint);
  assertValidTransition(currentStatus, nextStatus);

  if (isMaintenanceRole(user.role)) {
    assertStaffAssignedToComplaint(user, complaint);

    if (!staffStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Maintenance staff can only move assigned complaints into progress", 403);
    }
  } else if (isManagementRole(user.role)) {
    assertManagerCanManageComplaint(user, complaint);

    if (!managerStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Use the dedicated workflow endpoint for this status update", 400);
    }

    if (nextStatus === "ASSIGNED" && !complaint.assignedStaff) {
      throw new AppError("Assign staff before moving complaint to ASSIGNED", 400);
    }

    if (
      nextStatus === "CLOSED" &&
      complaint.residentConfirmation?.status !== "CONFIRMED"
    ) {
      throw new AppError("Resident confirmation is required before closing this complaint", 400);
    }
  } else {
    throw new AppError("You do not have permission to update complaint status", 403);
  }

  const set: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "CLOSED") {
    set.closedBy = user.id;
    set.closedAt = new Date();
  }

  return updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));
};

export const completeComplaintWork = async (
  complaintId: string,
  data: CompleteComplaintWorkInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertStaffAssignedToComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!completionAllowedStatuses.has(currentStatus)) {
    throw new AppError(`Complaint work cannot be completed while it is ${currentStatus}`, 400);
  }

  const set: Record<string, unknown> = {
    status: "AWAITING_APPROVAL",
    completionDetails: {
      details: data.completionDetails,
      completedBy: user.id,
      completedAt: new Date(),
    },
  };

  if (data.finalCost !== undefined) {
    set.finalCost = data.finalCost;
  }

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));



  return updatedComplaint;
};

export const approveComplaint = async (
  complaintId: string,
  data: ApproveComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed complaints awaiting approval can be approved", 400);
  }

  const set: Record<string, unknown> = {
    status: "APPROVED",
    approvalDetails: {
      status: "APPROVED",
      reviewedBy: user.id,
      reviewedAt: new Date(),
      remarks: data.remarks ?? null,
      rejectionReason: null,
    },
    residentConfirmation: {
      status: "PENDING",
      requestedAt: new Date(),
      confirmedBy: null,
      confirmedAt: null,
      remarks: null,
    },
  };

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));



  return updatedComplaint;
};

export const rejectComplaint = async (
  complaintId: string,
  data: RejectComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed complaints awaiting approval can be rejected", 400);
  }

  const set: Record<string, unknown> = {
    status: "REJECTED",
    approvalDetails: {
      status: "REJECTED",
      reviewedBy: user.id,
      reviewedAt: new Date(),
      remarks: data.remarks ?? null,
      rejectionReason: data.reason,
    },
  };

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(data.reason, user));



  return updatedComplaint;
};

export const cancelComplaint = async (
  complaintId: string,
  data: CancelComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  const role = normalizeRole(user.role);

  if (residentRoles.has(role)) {
    if (!sameId(complaint.resident, user.id)) {
      throw new AppError("You can only cancel your own complaints", 403);
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(getComplaintStatus(complaint))) {
      throw new AppError("Residents can only cancel complaints before assignment", 400);
    }
  } else if (managementRoles.has(role)) {
    assertManagerCanManageComplaint(user, complaint);
  } else {
    throw new AppError("You do not have permission to cancel complaints", 403);
  }

  assertNotTerminal(complaint);

  const set: Record<string, unknown> = {
    status: "CANCELLED",
    cancelledBy: user.id,
    cancelledAt: new Date(),
    cancellationReason: data.reason ?? null,
  };

  return updateComplaintDocument(complaintId, set, createRemark(data.reason, user));
};

export const confirmComplaintResolution = async (
  complaintId: string,
  data: ConfirmComplaintResolutionInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  const role = normalizeRole(user.role);

  if (!residentRoles.has(role)) {
    throw new AppError("Only the resident can confirm complaint resolution", 403);
  }

  if (!sameId(complaint.resident, user.id)) {
    throw new AppError("You can only confirm your own complaint", 403);
  }

  const currentStatus = getComplaintStatus(complaint);

  if (currentStatus === "CLOSED" && complaint.residentConfirmation?.status === "CONFIRMED") {
    return complaint;
  }

  if (currentStatus !== "APPROVED") {
    throw new AppError("Only approved complaints can be confirmed", 400);
  }

  const now = new Date();
  const updatedComplaint = await updateComplaintDocument(
    complaintId,
    {
      status: "CLOSED",
      residentConfirmation: {
        status: "CONFIRMED",
        requestedAt: complaint.residentConfirmation?.requestedAt ?? now,
        confirmedBy: user.id,
        confirmedAt: now,
        remarks: data.remarks ?? null,
      },
      closedBy: user.id,
      closedAt: now,
    },
    createRemark(data.remarks ?? "Resident confirmed resolution", user)
  );



  return updatedComplaint;
};
