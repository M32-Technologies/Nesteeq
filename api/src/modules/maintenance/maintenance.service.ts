import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { createAlert } from "../alert/alert.service.js";
import {
  Complaint,
  complaintStatuses,
  type ComplaintDocument,
  type ComplaintStatus,
} from "../complaint/complaint.model.js";
import {
  Maintenance,
  type MaintenanceCostStatus,
  maintenanceStatuses,
  type MaintenanceDocument,
  type MaintenanceStatus,
} from "./maintenance.model.js";
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

type MaintenanceNote = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

type MaintenanceProgressUpdate = {
  details: string;
  status: MaintenanceStatus;
  remarks: string | null;
  by: string;
  role: string;
  createdAt: Date;
};

type MaintenancePush = {
  progressUpdates?: MaintenanceProgressUpdate;
  workNotes?: MaintenanceNote;
  managerRemarks?: MaintenanceNote;
};

type ComplaintRemark = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

type MaintenanceFilter = Record<string, unknown>;

const residentRoles = new Set(["RESIDENT", "OWNER", "TENANT"]);
const managementRoles = new Set(["ADMIN", "SUPER_ADMIN", "PROPERTY_MANAGER", "FACILITY_MANAGER"]);
const globalManagementRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const maintenanceRoles = new Set(["MAINTENANCE_STAFF", "MAINTENANCE_TECHNICIAN", "TECHNICIAN"]);

const terminalStatuses = new Set<MaintenanceStatus>(["CANCELLED", "CLOSED"]);
const complaintTerminalStatuses = new Set<ComplaintStatus>(["APPROVED", "CANCELLED", "CLOSED"]);
const complaintMaintenanceSourceStatuses = new Set<ComplaintStatus>([
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

const assignableMaintenanceStatuses = new Set<MaintenanceStatus>([
  "PENDING",
  "ASSIGNED",
  "ON_HOLD",
  "REJECTED",
]);

const activeMaintenanceStatuses: MaintenanceStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

const managerStatusUpdateTargets = new Set<MaintenanceStatus>([
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
]);

const staffStatusUpdateTargets = new Set<MaintenanceStatus>(["IN_PROGRESS", "ON_HOLD"]);
const approvalAllowedStatuses = new Set<MaintenanceStatus>(["WORK_COMPLETED", "AWAITING_APPROVAL"]);

const normalizeRole = (role: string | null | undefined): string =>
  (role ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isResidentRole = (role: string): boolean => residentRoles.has(normalizeRole(role));
const isManagementRole = (role: string): boolean => managementRoles.has(normalizeRole(role));
const isGlobalManagementRole = (role: string): boolean => globalManagementRoles.has(normalizeRole(role));
const isMaintenanceRole = (role: string): boolean => maintenanceRoles.has(normalizeRole(role));

const isMaintenanceStatus = (value: string): value is MaintenanceStatus =>
  (maintenanceStatuses as readonly string[]).includes(value);

const isComplaintStatus = (value: string): value is ComplaintStatus =>
  (complaintStatuses as readonly string[]).includes(value);

const getMaintenanceStatus = (maintenance: Pick<MaintenanceDocument, "status">): MaintenanceStatus => {
  if (!isMaintenanceStatus(maintenance.status)) {
    throw new AppError("Maintenance has an invalid status", 500);
  }

  return maintenance.status;
};

const getComplaintStatus = (complaint: Pick<ComplaintDocument, "status">): ComplaintStatus => {
  if (!isComplaintStatus(complaint.status)) {
    throw new AppError("Complaint has an invalid status", 500);
  }

  return complaint.status;
};

const sameId = (left: unknown, right: unknown): boolean =>
  String(left ?? "") === String(right ?? "");

const getMongoId = (value: unknown): string => String(value ?? "");

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

const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

const ensureCurrentUserExists = async (user: AuthenticatedMaintenanceUser): Promise<AuthUserRecord> => {
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

const assertValidTransition = (
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

const assertNotTerminal = (maintenance: MaintenanceDocument): void => {
  const status = getMaintenanceStatus(maintenance);

  if (status === "CLOSED") {
    throw new AppError("Maintenance already closed", 400);
  }

  if (status === "CANCELLED") {
    throw new AppError("Maintenance already cancelled", 400);
  }
};

const createNote = (
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

const createComplaintRemark = (
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

const createProgressUpdate = (
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

const assertManagerCanManageApartment = (
  user: AuthenticatedMaintenanceUser,
  apartmentId: string
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage maintenance", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);

  if (!globalManagementRoles.has(role) && !managerApartmentId) {
    throw new AppError("Management user must be linked to an apartment", 403);
  }

  if (!globalManagementRoles.has(role) && apartmentId !== managerApartmentId) {
    throw new AppError("You do not have permission to manage maintenance for this apartment", 403);
  }
};

const assertManagerCanManageMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  assertManagerCanManageApartment(user, maintenance.apartment);
};

const assertStaffAssignedToMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  if (!isMaintenanceRole(user.role)) {
    throw new AppError("Only maintenance staff can perform this action", 403);
  }

  if (!maintenance.assignedStaff || !sameId(maintenance.assignedStaff, user.id)) {
    throw new AppError("You can only access maintenance assigned to you", 403);
  }
};

const assertCanAccessMaintenance = (
  user: AuthenticatedMaintenanceUser,
  maintenance: MaintenanceDocument
): void => {
  const role = normalizeRole(user.role);

  if (managementRoles.has(role)) {
    assertManagerCanManageMaintenance(user, maintenance);
    return;
  }

  if (maintenanceRoles.has(role)) {
    assertStaffAssignedToMaintenance(user, maintenance);
    return;
  }

  if (residentRoles.has(role)) {
    if (!sameId(maintenance.resident, user.id)) {
      throw new AppError("You can only access maintenance related to your own complaints", 403);
    }
    return;
  }

  throw new AppError("You do not have permission to access maintenance", 403);
};

const ensureStaffCanWorkOnApartment = (
  staff: AuthUserRecord,
  fallbackStaffId: string,
  apartmentId: string,
  manager: AuthenticatedMaintenanceUser
): string => {
  const staffId = getAuthUserId(staff, fallbackStaffId);
  const staffApartmentId = normalizeOptionalString(staff.apartmentId);
  const managerApartmentId = normalizeOptionalString(manager.apartmentId);

  if (
    managerApartmentId &&
    !isGlobalManagementRole(manager.role) &&
    staffApartmentId &&
    staffApartmentId !== managerApartmentId
  ) {
    throw new AppError("Staff member does not belong to your apartment", 403);
  }

  if (staffApartmentId && staffApartmentId !== apartmentId) {
    throw new AppError("Staff member does not belong to this apartment", 400);
  }

  return staffId;
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

const applySharedFilters = (
  filter: MaintenanceFilter,
  query: GetMaintenanceQuery
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

  if (query.complaint) {
    filter.complaint = query.complaint;
  }

  if (query.costStatus) {
    filter["costReview.status"] = query.costStatus;
  }
};

const applyManagerFilters = (
  filter: MaintenanceFilter,
  query: GetMaintenanceQuery,
  user: AuthenticatedMaintenanceUser
): void => {
  const role = normalizeRole(user.role);
  const managerApartmentId = normalizeOptionalString(user.apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (query.apartment && query.apartment !== managerApartmentId) {
      throw new AppError("You do not have permission to view maintenance for this apartment", 403);
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

const buildRoleScopedFilter = (
  query: GetMaintenanceQuery,
  user: AuthenticatedMaintenanceUser
): MaintenanceFilter => {
  const role = normalizeRole(user.role);
  const filter: MaintenanceFilter = {};

  applySharedFilters(filter, query);

  if (managementRoles.has(role)) {
    applyManagerFilters(filter, query, user);
  } else if (maintenanceRoles.has(role)) {
    filter.assignedStaff = user.id;
  } else if (residentRoles.has(role)) {
    filter.resident = user.id;
  } else {
    throw new AppError("You do not have permission to access maintenance", 403);
  }

  return filter;
};

const getComplaintSyncForStatus = (
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
    await createAlert({
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

  await createAlert({
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

  await createAlert({
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

  await createAlert({
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
    createAlert({
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
      ? createAlert({
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
    await createAlert({
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
    createAlert({
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
      ? createAlert({
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
    await createAlert({
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
