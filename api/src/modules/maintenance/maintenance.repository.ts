import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isMaintenanceRole } from "../../utils/role.js";
import { getMongoId } from "../../utils/serviceHelpers.js";
import { Complaint, type ComplaintDocument } from "../complaint/complaint.model.js";
import type { AuthenticatedMaintenanceUser } from "./maintenance.service.js";
import { Maintenance, type MaintenanceDocument } from "./maintenance.model.js";
import {
  createComplaintRemark,
  type ComplaintRemark,
  type MaintenancePush,
} from "./maintenance.workflow.js";

export type AuthUserRecord = {
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

const findAuthUserById = async (userId: string): Promise<AuthUserRecord | null> =>
  getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(userId) });

export const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

export const ensureCurrentUserExists = async (
  user: AuthenticatedMaintenanceUser
): Promise<AuthUserRecord> => {
  const existingUser = await findAuthUserById(user.id);

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }

  return existingUser;
};

export const ensureStaffUser = async (staffId: string): Promise<AuthUserRecord> => {
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

export const getMaintenanceOrThrow = async (maintenanceId: string) => {
  assertValidMaintenanceId(maintenanceId);

  const maintenance = await Maintenance.findById(maintenanceId);

  if (!maintenance) {
    throw new AppError("Maintenance not found", 404);
  }

  return maintenance;
};

export const getComplaintOrThrow = async (complaintId: string) => {
  assertValidComplaintId(complaintId);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
};

export const updateMaintenanceDocument = async (
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

export const syncComplaint = async (
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

export const syncComplaintFromMaintenance = async (
  maintenance: MaintenanceDocument,
  set: Record<string, unknown>,
  user: AuthenticatedMaintenanceUser,
  remark?: string
): Promise<void> => {
  const complaintId = getMongoId(maintenance.complaint);
  assertValidComplaintId(complaintId);

  await syncComplaint(complaintId, set, createComplaintRemark(remark, user));
};
