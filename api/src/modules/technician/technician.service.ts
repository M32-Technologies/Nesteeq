import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isMaintenanceRole, isTechnicianCreatorRole } from "../../utils/role.js";



import { Complaint } from "../complaint/complaint.model.js";
import {
  assignComplaint,
  completeComplaintWork,
  updateComplaintStatus,
} from "../complaint/complaint.service.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import {
  assignMaintenance,
  completeMaintenance,
  updateMaintenanceProgress,
  updateMaintenanceStatus,
} from "../maintenance/maintenance.service.js";
import { Technician } from "./technician.model.js";
import {
  assertCanAccessTechnician,
  assertManagerCanManageApartment,
  buildRoleScopedFilter,
} from "./technician.policy.js";
import {
  activeComplaintStatuses,
  activeMaintenanceStatuses,
  assertTechnicianIsAssignable,
  getNextTechnicianStatus,
  isComplaintStatus,
  isMaintenanceStatus,
} from "./technician.workflow.js";
import type {
  AssignTechnicianWorkInput,
  CreateTechnicianInput,
  GetTechnicianTasksQuery,
  GetTechniciansQuery,
  UpdateTechnicianInput,
  UpdateTechnicianStatusInput,
  UpdateTechnicianTaskStatusInput,
} from "./technician.schema.js";

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const sameId = (id1: any, id2: any): boolean => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};



export type AuthenticatedTechnicianUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
};

type AuthUserRecord = {
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

const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

const ensureCurrentUserExists = async (
  user: AuthenticatedTechnicianUser
): Promise<AuthUserRecord> => {
  const existingUser = await findAuthUserById(user.id);

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }

  return existingUser;
};

const ensureTechnicianAuthUser = async (userId: string): Promise<AuthUserRecord> => {
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

const assertValidWorkId = (workId: string): void => {
  if (!Types.ObjectId.isValid(workId)) {
    throw new AppError("Invalid work ID", 400);
  }
};

const getTechnicianOrThrow = async (technicianId: string) => {
  assertValidTechnicianId(technicianId);

  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new AppError("Technician not found", 404);
  }

  return technician;
};

const syncTechnicianWorkloadStatus = async (userId: string) => {
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

export const createTechnician = async (
  data: CreateTechnicianInput,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  if (!isTechnicianCreatorRole(user.role)) {
    throw new AppError("You do not have permission to add technicians", 403);
  }

  assertManagerCanManageApartment(user, data.apartmentId);

  const authUser = await ensureTechnicianAuthUser(data.userId);
  const userId = getAuthUserId(authUser, data.userId);
  const authApartmentId = normalizeOptionalString(authUser.apartmentId);
  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const apartmentId = normalizeOptionalString(data.apartmentId) ?? authApartmentId ?? managerApartmentId;

  assertManagerCanManageApartment(user, apartmentId);

  if (authApartmentId && apartmentId && authApartmentId !== apartmentId) {
    throw new AppError("Technician auth user belongs to a different apartment", 400);
  }

  const existingTechnician = await Technician.findOne({ userId }).lean();

  if (existingTechnician) {
    throw new AppError("Technician already exists for this user", 409);
  }

  return Technician.create({
    userId,
    fullName: data.fullName || authUser.name || "Technician",
    email: data.email ?? authUser.email ?? null,
    phone: data.phone ?? authUser.phone ?? null,
    apartmentId,
    employeeCode: data.employeeCode ?? null,
    specializations: data.specializations,
    status: data.status,
    shift: data.shift ?? null,
    notes: data.notes ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  });
};

export const getTechnicians = async (
  query: GetTechniciansQuery,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  const filter = buildRoleScopedFilter(query, user);
  const skip = (query.page - 1) * query.limit;

  const [technicians, total] = await Promise.all([
    Technician.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Technician.countDocuments(filter),
  ]);

  return {
    technicians,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getTechnicianById = async (
  technicianId: string,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  const technician = await getTechnicianOrThrow(technicianId);
  assertCanAccessTechnician(user, technician);

  return technician;
};

export const updateTechnician = async (
  technicianId: string,
  data: UpdateTechnicianInput,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  const technician = await getTechnicianOrThrow(technicianId);
  assertManagerCanManageApartment(user, technician.apartmentId);
  assertManagerCanManageApartment(user, data.apartmentId ?? technician.apartmentId);

  const set: Record<string, unknown> = {
    updatedBy: user.id,
  };

  if (data.fullName !== undefined) set.fullName = data.fullName;
  if (data.email !== undefined) set.email = data.email;
  if (data.phone !== undefined) set.phone = data.phone;
  if (data.apartmentId !== undefined) set.apartmentId = data.apartmentId;
  if (data.employeeCode !== undefined) set.employeeCode = data.employeeCode;
  if (data.specializations !== undefined) set.specializations = data.specializations;
  if (data.shift !== undefined) set.shift = data.shift;
  if (data.notes !== undefined) set.notes = data.notes;

  const updatedTechnician = await Technician.findByIdAndUpdate(
    technicianId,
    { $set: set },
    { new: true, runValidators: true }
  );

  if (!updatedTechnician) {
    throw new AppError("Technician not found", 404);
  }

  return updatedTechnician;
};

export const updateTechnicianStatus = async (
  technicianId: string,
  data: UpdateTechnicianStatusInput,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  const technician = await getTechnicianOrThrow(technicianId);
  assertManagerCanManageApartment(user, technician.apartmentId);

  const set: Record<string, unknown> = {
    status: data.status,
    updatedBy: user.id,
  };

  if (data.notes !== undefined) {
    set.notes = data.notes;
  }

  if (data.status === "INACTIVE") {
    set.deactivatedAt = new Date();
    set.deactivatedBy = user.id;
  } else {
    set.deactivatedAt = null;
    set.deactivatedBy = null;
  }

  const updatedTechnician = await Technician.findByIdAndUpdate(
    technicianId,
    { $set: set },
    { new: true, runValidators: true }
  );

  if (!updatedTechnician) {
    throw new AppError("Technician not found", 404);
  }

  return updatedTechnician;
};

export const deactivateTechnician = async (
  technicianId: string,
  user: AuthenticatedTechnicianUser
) => {
  return updateTechnicianStatus(
    technicianId,
    {
      status: "INACTIVE",
    },
    user
  );
};

export const assignTechnicianWork = async (
  technicianId: string,
  data: AssignTechnicianWorkInput,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);
  assertValidWorkId(data.workId);

  const technician = await getTechnicianOrThrow(technicianId);
  assertManagerCanManageApartment(user, technician.apartmentId);
  assertTechnicianIsAssignable(technician);

  await ensureTechnicianAuthUser(technician.userId);

  const payload = {
    assignedStaff: technician.userId,
    estimatedCost: data.estimatedCost,
    remarks: data.remarks,
  };

  const work =
    data.workType === "complaint"
      ? await assignComplaint(data.workId, payload, user)
      : await assignMaintenance(data.workId, payload, user);

  const updatedTechnician = await syncTechnicianWorkloadStatus(technician.userId);

  return {
    technician: updatedTechnician ?? technician,
    workType: data.workType,
    work,
  };
};

export const getTechnicianTasks = async (
  technicianId: string,
  query: GetTechnicianTasksQuery,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);

  const technician = await getTechnicianOrThrow(technicianId);
  assertCanAccessTechnician(user, technician);

  const skip = (query.page - 1) * query.limit;
  const shouldLoadComplaints = query.type === "all" || query.type === "complaint";
  const shouldLoadMaintenance = query.type === "all" || query.type === "maintenance";
  const complaintFilter: Record<string, unknown> = {
    assignedStaff: technician.userId,
  };
  const maintenanceFilter: Record<string, unknown> = {
    assignedStaff: technician.userId,
  };

  if (query.complaintStatus) {
    complaintFilter.status = query.complaintStatus;
  }

  if (query.maintenanceStatus) {
    maintenanceFilter.status = query.maintenanceStatus;
  }

  const [complaints, complaintTotal, maintenance, maintenanceTotal] = await Promise.all([
    shouldLoadComplaints
      ? Complaint.find(complaintFilter).sort({ updatedAt: -1 }).skip(skip).limit(query.limit).lean()
      : Promise.resolve([]),
    shouldLoadComplaints ? Complaint.countDocuments(complaintFilter) : Promise.resolve(0),
    shouldLoadMaintenance
      ? Maintenance.find(maintenanceFilter).sort({ updatedAt: -1 }).skip(skip).limit(query.limit).lean()
      : Promise.resolve([]),
    shouldLoadMaintenance ? Maintenance.countDocuments(maintenanceFilter) : Promise.resolve(0),
  ]);

  return {
    technician,
    complaints,
    maintenance,
    totals: {
      complaints: complaintTotal,
      maintenance: maintenanceTotal,
      all: complaintTotal + maintenanceTotal,
    },
    pagination: {
      page: query.page,
      limit: query.limit,
    },
  };
};

export const updateTechnicianTaskStatus = async (
  technicianId: string,
  data: UpdateTechnicianTaskStatusInput,
  user: AuthenticatedTechnicianUser
) => {
  await ensureCurrentUserExists(user);
  assertValidWorkId(data.workId);

  const technician = await getTechnicianOrThrow(technicianId);
  assertCanAccessTechnician(user, technician);

  let work: unknown;

  if (data.workType === "complaint") {
    await assertComplaintAssignedToTechnician(data.workId, technician.userId);

    if (data.status === "AWAITING_APPROVAL" || data.status === "WORK_COMPLETED") {
      if (!data.completionDetails) {
        throw new AppError("Completion details are required to complete complaint work", 400);
      }

      work = await completeComplaintWork(
        data.workId,
        {
          completionDetails: data.completionDetails,
          finalCost: data.finalCost,
          remarks: data.remarks,
        },
        user
      );
    } else {
      if (!isComplaintStatus(data.status)) {
        throw new AppError("Invalid complaint status", 400);
      }

      work = await updateComplaintStatus(
        data.workId,
        {
          status: data.status,
          remarks: data.remarks,
        },
        user
      );
    }
  } else {
    await assertMaintenanceAssignedToTechnician(data.workId, technician.userId);

    if (data.status === "AWAITING_APPROVAL" || data.status === "WORK_COMPLETED") {
      if (!data.completionDetails) {
        throw new AppError("Completion details are required to complete maintenance work", 400);
      }

      work = await completeMaintenance(
        data.workId,
        {
          completionDetails: data.completionDetails,
          finalCost: data.finalCost,
          workNotes: data.workNotes,
          remarks: data.remarks,
        },
        user
      );
    } else {
      if (!isMaintenanceStatus(data.status)) {
        throw new AppError("Invalid maintenance status", 400);
      }

      work =
        (data.status === "IN_PROGRESS" || data.status === "ON_HOLD") && data.progressDetails
          ? await updateMaintenanceProgress(
              data.workId,
              {
                progressDetails: data.progressDetails,
                status: data.status,
                remarks: data.remarks,
              },
              user
            )
          : await updateMaintenanceStatus(
              data.workId,
              {
                status: data.status,
                remarks: data.remarks,
              },
              user
            );
    }
  }

  const updatedTechnician = await syncTechnicianWorkloadStatus(technician.userId);

  return {
    technician: updatedTechnician ?? technician,
    workType: data.workType,
    work,
  };
};
