import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isMaintenanceRole } from "../../utils/role.js";
import type { AuthenticatedComplaintUser } from "./complaint.service.js";
import { Complaint, type ComplaintDocument } from "./complaint.model.js";

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

export const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

export const ensureCurrentUserExists = async (
  user: AuthenticatedComplaintUser
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

const assertValidComplaintId = (complaintId: string): void => {
  if (!Types.ObjectId.isValid(complaintId)) {
    throw new AppError("Invalid complaint ID", 400);
  }
};

export const getComplaintOrThrow = async (complaintId: string) => {
  assertValidComplaintId(complaintId);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
};

export const updateComplaintDocument = async (
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
