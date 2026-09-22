import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { isMaintenanceRole, isTechnicianCreatorRole } from "../../utils/role.js";



import { Complaint, complaintCategories } from "../complaint/complaint.model.js";
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
import { Staff } from "../staff/staff.model.js";
import { resolveFacilityManagerApartmentId } from "../facility/facility.service.js";
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

  if (!user.apartmentId) {
    const resolvedApt = await resolveFacilityManagerApartmentId(user as any);
    if (resolvedApt) {
      user.apartmentId = resolvedApt;
    } else if (existingUser.apartmentId) {
      user.apartmentId = existingUser.apartmentId;
    }
  }

  return existingUser;
};

export const normalizeSpecializations = (rawType?: string | null): string[] => {
  if (!rawType) return ["MAINTENANCE"];
  const t = rawType.trim().toUpperCase();
  if (complaintCategories.includes(t as any)) return [t];
  if (/electr/i.test(t)) return ["ELECTRICAL"];
  if (/plumb/i.test(t)) return ["PLUMBING"];
  if (/clean/i.test(t)) return ["CLEANING"];
  if (/secur/i.test(t)) return ["SECURITY"];
  if (/lift|elevator/i.test(t)) return ["LIFT"];
  if (/water/i.test(t)) return ["WATER"];
  return ["MAINTENANCE"];
};

export const formatTechnicianResponse = (tech: any, assignedTaskCount = 0) => {
  const rawId = tech._id?.toString() || tech.id || "";
  const name = tech.fullName || tech.name || "Technician";
  const specs =
    tech.specializations && tech.specializations.length > 0
      ? tech.specializations
      : tech.specialization && tech.specialization.length > 0
        ? tech.specialization
        : ["MAINTENANCE"];

  return {
    _id: rawId,
    id: rawId,
    userId: tech.userId || rawId,
    name,
    fullName: name,
    email: tech.email || undefined,
    phone: tech.phone || undefined,
    role: "maintenance_technician",
    status: tech.status || "ACTIVE",
    specialization: specs,
    specializations: specs,
    assignedTaskCount,
    shift: tech.shift ?? null,
    notes: tech.notes ?? null,
    joinedAt: tech.joinedAt ? new Date(tech.joinedAt).toISOString() : undefined,
    createdAt: tech.createdAt ? new Date(tech.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: tech.updatedAt ? new Date(tech.updatedAt).toISOString() : new Date().toISOString(),
  };
};

export const syncStaffTechnicians = async (apartmentId?: string | null): Promise<void> => {
  if (!apartmentId) return;

  const aptValues: unknown[] = [apartmentId];
  if (Types.ObjectId.isValid(apartmentId)) {
    aptValues.push(new Types.ObjectId(apartmentId));
  }

  const staffList = await Staff.find({
    $or: [
      { apartment: { $in: aptValues } },
      { apartmentId: { $in: aptValues } },
    ],
    role: { $regex: /^(maintenance_technician|technician|maintenance_staff|staff)$/i },
  } as any).lean();

  for (const staff of staffList) {
    if (!staff.userId) continue;

    const authUser = await findAuthUserById(staff.userId);
    const fullName = authUser?.name || "Technician";
    const email = authUser?.email || null;
    const phone = staff.phone || authUser?.phone || null;
    const specializations = normalizeSpecializations(staff.maintenanceType);
    const existing = await Technician.findOne({ userId: staff.userId });

    const status =
      staff.status === "inactive"
        ? "INACTIVE"
        : existing?.status || "ACTIVE";

    await Technician.findOneAndUpdate(
      { userId: staff.userId },
      {
        $setOnInsert: {
          userId: staff.userId,
          createdBy: staff.userId,
          createdAt: staff.createdAt || new Date(),
        },
        $set: {
          fullName,
          email,
          phone,
          apartmentId: apartmentId.toString(),
          specializations,
          status,
          updatedAt: staff.updatedAt || new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  const authUsers = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .find({
      role: { $regex: /^(maintenance_technician|technician|maintenance_staff)$/i },
      $or: [
        { apartmentId: { $in: aptValues as any } },
        { apartment: { $in: aptValues as any } },
      ],
    })
    .toArray();

  for (const u of authUsers) {
    const userId = getAuthUserId(u, u._id?.toHexString() || "");
    if (!userId) continue;

    const existing = await Technician.findOne({ userId });
    const fullName = u.name || "Technician";
    const email = u.email || null;
    const phone = u.phone || null;

    await Technician.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          createdBy: userId,
          createdAt: new Date(),
        },
        $set: {
          fullName,
          email,
          phone,
          apartmentId: apartmentId.toString(),
          specializations: existing?.specializations?.length ? existing.specializations : ["MAINTENANCE"],
          status: existing?.status || "ACTIVE",
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
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

  let technician = await Technician.findById(technicianId);

  if (!technician) {
    const staff = await Staff.findOne({
      $or: [
        { _id: new Types.ObjectId(technicianId) },
        { userId: technicianId },
      ],
    }).lean();

    if (staff) {
      await syncStaffTechnicians(staff.apartmentId?.toString());
      technician = await Technician.findOne({ userId: staff.userId });
    }
  }

  if (!technician) {
    const authUser = await findAuthUserById(technicianId);
    if (authUser?.apartmentId) {
      await syncStaffTechnicians(authUser.apartmentId);
      technician = await Technician.findOne({ userId: technicianId });
    }
  }

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

  if (user.apartmentId) {
    try {
      await syncStaffTechnicians(user.apartmentId);
    } catch {
      // ignore
    }
  }

  const filter = buildRoleScopedFilter(query, user);
  const skip = (query.page - 1) * query.limit;

  const [technicians, total] = await Promise.all([
    Technician.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    Technician.countDocuments(filter),
  ]);

  const userIds = technicians.map((t: any) => t.userId).filter(Boolean);
  const countMap = new Map<string, number>();

  if (userIds.length > 0) {
    const [complaintCounts, maintenanceCounts] = await Promise.all([
      Complaint.aggregate([
        {
          $match: {
            assignedStaff: { $in: userIds },
            status: { $in: activeComplaintStatuses },
          },
        },
        { $group: { _id: "$assignedStaff", count: { $sum: 1 } } },
      ]),
      Maintenance.aggregate([
        {
          $match: {
            assignedStaff: { $in: userIds },
            status: { $in: activeMaintenanceStatuses },
          },
        },
        { $group: { _id: "$assignedStaff", count: { $sum: 1 } } },
      ]),
    ]);

    for (const item of complaintCounts) {
      countMap.set(String(item._id), (countMap.get(String(item._id)) || 0) + item.count);
    }
    for (const item of maintenanceCounts) {
      countMap.set(String(item._id), (countMap.get(String(item._id)) || 0) + item.count);
    }
  }

  const formattedTechnicians = technicians.map((t: any) =>
    formatTechnicianResponse(t, countMap.get(t.userId) || 0)
  );

  return {
    technicians: formattedTechnicians,
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

  const [activeComplaints, activeMaintenance] = await Promise.all([
    Complaint.countDocuments({
      assignedStaff: technician.userId,
      status: { $in: activeComplaintStatuses },
    }),
    Maintenance.countDocuments({
      assignedStaff: technician.userId,
      status: { $in: activeMaintenanceStatuses },
    }),
  ]);

  return formatTechnicianResponse(
    technician.toObject ? technician.toObject() : technician,
    activeComplaints + activeMaintenance
  );
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

  const fullName = data.fullName ?? data.name;
  if (fullName !== undefined) set.fullName = fullName;
  if (data.email !== undefined) set.email = data.email;
  if (data.phone !== undefined) set.phone = data.phone;
  if (data.apartmentId !== undefined) set.apartmentId = data.apartmentId;
  if (data.employeeCode !== undefined) set.employeeCode = data.employeeCode;
  if (data.specializations !== undefined) set.specializations = data.specializations;
  if (data.shift !== undefined) set.shift = data.shift;
  if (data.notes !== undefined) set.notes = data.notes;

  const updatedTechnician = await Technician.findByIdAndUpdate(
    technician._id,
    { $set: set },
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedTechnician) {
    throw new AppError("Technician not found", 404);
  }

  if (technician.userId) {
    const userUpdates: Record<string, unknown> = {};
    if (fullName !== undefined) userUpdates.name = fullName;
    if (data.email !== undefined) userUpdates.email = data.email;
    if (data.phone !== undefined) userUpdates.phone = data.phone;

    if (Object.keys(userUpdates).length > 0) {
      await getAuthDB()
        .collection("user")
        .updateOne(
          { $or: buildAuthUserIdFilters(technician.userId) },
          { $set: userUpdates }
        );
    }

    if (data.phone !== undefined) {
      await Staff.updateMany(
        { userId: technician.userId },
        { $set: { phone: data.phone } }
      );
    }
  }

  const rawDoc = updatedTechnician && "toObject" in updatedTechnician
    ? (updatedTechnician as any).toObject()
    : updatedTechnician;

  return formatTechnicianResponse(rawDoc);
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
    technician._id,
    { $set: set },
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedTechnician) {
    throw new AppError("Technician not found", 404);
  }

  if (technician.userId) {
    const staffStatus = data.status === "INACTIVE" ? "inactive" : "active";
    await Staff.updateMany(
      { userId: technician.userId },
      { $set: { status: staffStatus } }
    );
  }

  const rawDoc = updatedTechnician && "toObject" in updatedTechnician
    ? (updatedTechnician as any).toObject()
    : updatedTechnician;

  return formatTechnicianResponse(rawDoc);
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
