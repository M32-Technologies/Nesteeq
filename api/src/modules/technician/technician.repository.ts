import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isMaintenanceRole } from "../../utils/role.js";
import { sameId } from "../../utils/serviceHelpers.js";
import { Complaint } from "../complaint/complaint.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import type { AuthenticatedTechnicianUser } from "./technician.service.js";
import { Technician } from "./technician.model.js";
import {
  activeComplaintStatuses,
  activeMaintenanceStatuses,
  getNextTechnicianStatus,
} from "./technician.workflow.js";

export type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
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
  user: AuthenticatedTechnicianUser
): Promise<AuthUserRecord> => {
  const existingUser = await findAuthUserById(user.id);

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }

  return existingUser;
};

export const ensureTechnicianAuthUser = async (userId: string): Promise<AuthUserRecord> => {
  const authUser = await findAuthUserById(userId);

  if (!authUser) {
    throw new AppError("Technician user not found", 404);
  }

  if (!authUser.role || !isMaintenanceRole(authUser.role)) {
    throw new AppError("Technician user must have a maintenance technician role", 400);
  }

  return authUser;
};

const assertValidTechnicianId = (technicianId: string): void => {
  if (!Types.ObjectId.isValid(technicianId)) {
    throw new AppError("Invalid technician ID", 400);
  }
};

export const assertValidWorkId = (workId: string): void => {
  if (!Types.ObjectId.isValid(workId)) {
    throw new AppError("Invalid work ID", 400);
  }
};

export const getTechnicianOrThrow = async (technicianId: string) => {
  assertValidTechnicianId(technicianId);

  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new AppError("Technician not found", 404);
  }

  return technician;
};

export const syncTechnicianWorkloadStatus = async (userId: string) => {
  const technician = await Technician.findOne({ userId });

  if (!technician || technician.status === "INACTIVE" || technician.status === "ON_LEAVE") {
    return technician;
  }

  const [complaintsCount, maintenanceCount] = await Promise.all([
    Complaint.countDocuments({
      assignedStaff: userId,
      status: { $in: activeComplaintStatuses },
    }),
    Maintenance.countDocuments({
      assignedStaff: userId,
      status: { $in: activeMaintenanceStatuses },
    }),
  ]);

  const nextStatus = getNextTechnicianStatus(complaintsCount, maintenanceCount);

  if (technician.status === nextStatus) {
    return technician;
  }

  return Technician.findByIdAndUpdate(
    technician._id,
    { $set: { status: nextStatus } },
    { new: true, runValidators: true }
  );
};

export const assertComplaintAssignedToTechnician = async (workId: string, userId: string) => {
  const complaint = await Complaint.findById(workId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (!complaint.assignedStaff || !sameId(complaint.assignedStaff, userId)) {
    throw new AppError("Complaint is not assigned to this technician", 400);
  }

  return complaint;
};

export const assertMaintenanceAssignedToTechnician = async (workId: string, userId: string) => {
  const maintenance = await Maintenance.findById(workId);

  if (!maintenance) {
    throw new AppError("Maintenance not found", 404);
  }

  if (!maintenance.assignedStaff || !sameId(maintenance.assignedStaff, userId)) {
    throw new AppError("Maintenance is not assigned to this technician", 400);
  }

  return maintenance;
};
