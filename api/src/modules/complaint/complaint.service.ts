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
import { ResidentModel } from "../resident/resident.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
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

const escapeComplaintRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applySharedFilters = (
  filter: ComplaintFilter,
  query: GetComplaintsQuery
): void => {
  if (query.status && query.status !== "all") {
    if (query.status === "RESOLVED") {
      filter.status = { $in: ["WORK_COMPLETED", "APPROVED", "CLOSED"] };
    } else {
      filter.status = query.status;
    }
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.search?.trim()) {
    const sRegex = new RegExp(escapeComplaintRegex(query.search.trim()), "i");
    filter.$or = [
      { title: sRegex },
      { description: sRegex },
      { ticketNumber: sRegex },
    ];
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
 // await ensureCurrentUserExists(user);

  if (!isResidentRole(user.role)) {
    throw new AppError("Only residents can create complaints", 403);
  }

  const apartment = normalizeOptionalString(user.apartmentId);
  let flat = normalizeOptionalString(user.flatId);

  if (!flat && apartment && Types.ObjectId.isValid(apartment)) {
    const residentDoc = await ResidentModel.findOne({
      apartmentId: new Types.ObjectId(apartment),
      $or: [
        { userId: user.id },
        ...(Types.ObjectId.isValid(user.id) ? [{ _id: new Types.ObjectId(user.id) }] : []),
      ],
    }).lean();

    if (residentDoc?.flatId) {
      flat = residentDoc.flatId.toString();
    }
  }

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

  const countFilter = { ...filter };
  delete countFilter.status;

  const [complaints, total, pendingCount, inProgressCount, resolvedCount] = await Promise.all([
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Complaint.countDocuments(filter),
    Complaint.countDocuments({ ...countFilter, status: "PENDING" } as any),
    Complaint.countDocuments({ ...countFilter, status: { $in: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_APPROVAL"] } } as any),
    Complaint.countDocuments({ ...countFilter, status: { $in: ["WORK_COMPLETED", "APPROVED", "CLOSED"] } } as any),
  ]);

  const complaintIds = complaints.map((c) => c._id);
  const staffIds = Array.from(new Set(complaints.map((c) => c.assignedStaff).filter(Boolean))) as string[];
  const residentIds = Array.from(new Set(complaints.map((c) => c.resident).filter(Boolean))) as string[];
  const allUserIds = Array.from(new Set([...staffIds, ...residentIds]));

  const userObjectIds: ObjectId[] = [];
  const userStringIds: string[] = [];
  for (const id of allUserIds) {
    userStringIds.push(id);
    if (ObjectId.isValid(id)) {
      userObjectIds.push(new ObjectId(id));
    }
  }

  const [maintenanceJobs, authUsers] = await Promise.all([
    (Maintenance as any).find({ complaint: { $in: complaintIds } }).lean(),
    allUserIds.length > 0
      ? getAuthDB()
          .collection("user")
          .find({
            $or: [
              { id: { $in: userStringIds } },
              { _id: { $in: userObjectIds } },
            ],
          })
          .project({ _id: 1, id: 1, name: 1, email: 1, role: 1, phone: 1 })
          .toArray()
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, any>();
  for (const u of authUsers) {
    if (u.id) userMap.set(u.id, u);
    if (u._id) userMap.set(u._id.toString(), u);
  }

  const maintenanceMap = new Map<string, any>(
    maintenanceJobs.map((m: any) => [m.complaint.toString(), m])
  );

  const enrichedComplaints = complaints.map((c) => {
    const m = maintenanceMap.get(c._id.toString());
    const staffUser = c.assignedStaff ? userMap.get(c.assignedStaff) : null;
    const residentUser = c.resident ? userMap.get(c.resident) : null;

    const assignedStaffData = staffUser
      ? {
          _id: staffUser.id || staffUser._id?.toString() || c.assignedStaff,
          name: staffUser.name || "Technician",
          role: staffUser.role || "Staff",
          phone: staffUser.phone || null,
        }
      : c.assignedStaff
      ? {
          _id: c.assignedStaff,
          name: "Assigned Staff",
          role: "Staff",
          phone: null,
        }
      : null;

    const residentData = residentUser
      ? {
          _id: residentUser.id || residentUser._id?.toString() || c.resident,
          name: residentUser.name || "Resident",
          email: residentUser.email || null,
          phone: residentUser.phone || null,
        }
      : {
          _id: c.resident,
          name: "Resident",
        };

    return {
      ...c,
      assignedStaff: assignedStaffData,
      assignedTo: assignedStaffData,
      resident: c.resident,
      residentId: residentData,
      maintenance: m
        ? {
            _id: m._id.toString(),
            costReview: m.costReview,
            finalCost: m.finalCost,
            isSocietyCovered: m.isSocietyCovered,
            assignedStaff: m.assignedStaff,
            status: m.status,
          }
        : null,
    };
  });

  return {
    complaints: enrichedComplaints,
    counts: {
      total,
      pendingCount,
      inProgressCount,
      resolvedCount,
    },
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

  const staffUser = complaint.assignedStaff ? await findAuthUserById(complaint.assignedStaff) : null;
  const residentUser = complaint.resident ? await findAuthUserById(complaint.resident) : null;

  const assignedStaffData = staffUser
    ? {
        _id: (staffUser as any).id || (staffUser as any)._id?.toString() || complaint.assignedStaff,
        name: (staffUser as any).name || "Technician",
        role: (staffUser as any).role || "Staff",
        phone: (staffUser as any).phone || null,
      }
    : complaint.assignedStaff
    ? {
        _id: complaint.assignedStaff,
        name: "Assigned Staff",
        role: "Staff",
        phone: null,
      }
    : null;

  const residentData = residentUser
    ? {
        _id: (residentUser as any).id || (residentUser as any)._id?.toString() || complaint.resident,
        name: (residentUser as any).name || "Resident",
        email: (residentUser as any).email || null,
        phone: (residentUser as any).phone || null,
      }
    : {
        _id: complaint.resident,
        name: "Resident",
      };

  return {
    ...complaint.toObject(),
    assignedStaff: assignedStaffData,
    assignedTo: assignedStaffData,
    residentId: residentData,
  };
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
  } else {
    throw new AppError("You do not have permission to update complaint status", 403);
  }

  const set: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "CLOSED") {
    set.closedBy = user.id;
    set.closedAt = new Date();
    if (complaint.residentConfirmation?.status !== "CONFIRMED") {
      set["residentConfirmation.status"] = "CONFIRMED";
      set["residentConfirmation.confirmedAt"] = new Date();
      set["residentConfirmation.confirmedBy"] = user.id;
      set["residentConfirmation.remarks"] = "Closed by Facility Manager";
    }
  } else if (nextStatus === "APPROVED") {
    if (!complaint.approvalDetails?.status) {
      set["approvalDetails.status"] = "APPROVED";
      set["approvalDetails.reviewedBy"] = user.id;
      set["approvalDetails.reviewedAt"] = new Date();
    }
    if (!complaint.residentConfirmation?.status) {
      set["residentConfirmation.status"] = "PENDING";
      set["residentConfirmation.requestedAt"] = new Date();
    }
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

  if (!["APPROVED", "WORK_COMPLETED"].includes(currentStatus)) {
    throw new AppError("Only approved or completed complaints can be confirmed", 400);
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
