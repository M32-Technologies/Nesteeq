import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { getMongoId, sameId } from "../../utils/serviceHelpers.js";
import {
  assignComplaint,
  completeComplaintWork,
  updateComplaintStatus,
} from "../complaint/complaint.service.js";
import { Complaint } from "../complaint/complaint.model.js";
import {
  assignMaintenance,
  completeMaintenance,
  startMaintenance,
} from "../maintenance/maintenance.service.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { Technician } from "../technician/technician.model.js";
import type { AuthenticatedScheduleUser } from "./schedule.service.js";
import { Schedule, type ScheduleWorkType } from "./schedule.model.js";
import type {
  CreateScheduleInput,
  UpdateScheduleStatusInput,
} from "./schedule.schema.js";
import { assertManagerCanManageApartment, type ScheduleFilter } from "./schedule.policy.js";
import {
  activeComplaintStatuses,
  activeMaintenanceStatuses,
  activeScheduleStatuses,
  getDateBounds,
  getNextTechnicianStatus,
  workloadComplaintStatuses,
  workloadMaintenanceStatuses,
} from "./schedule.workflow.js";

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  flatId?: string | null;
};

type WorkResolution = {
  workType: ScheduleWorkType;
  complaint: Types.ObjectId | null;
  maintenance: Types.ObjectId | null;
  apartment: string | null;
  flat: string | null;
  title: string;
  description: string | null;
  priority: CreateScheduleInput["priority"];
};

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

export const ensureCurrentUserExists = async (user: AuthenticatedScheduleUser): Promise<void> => {
  const existingUser = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: buildAuthUserIdFilters(user.id) });

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }
};

const assertValidScheduleId = (scheduleId: string): void => {
  if (!Types.ObjectId.isValid(scheduleId)) {
    throw new AppError("Invalid schedule ID", 400);
  }
};

export const getScheduleOrThrow = async (scheduleId: string) => {
  assertValidScheduleId(scheduleId);

  const schedule = await Schedule.findById(scheduleId);

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  return schedule;
};

export const getTechnicianOrThrow = async (technicianId: string) => {
  if (!Types.ObjectId.isValid(technicianId)) {
    throw new AppError("Invalid technician ID", 400);
  }

  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new AppError("Technician not found", 404);
  }

  return technician;
};

export const ensureNoTechnicianConflict = async ({
  technicianId,
  startAt,
  endAt,
  excludeScheduleId,
}: {
  technicianId: string;
  startAt: Date;
  endAt: Date;
  excludeScheduleId?: string;
}) => {
  const filter: ScheduleFilter = {
    technician: new Types.ObjectId(technicianId),
    status: { $in: activeScheduleStatuses },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (excludeScheduleId) {
    filter._id = { $ne: new Types.ObjectId(excludeScheduleId) };
  }

  const conflict = await Schedule.findOne(filter).lean();

  if (conflict) {
    throw new AppError(
      `Technician already has a conflicting schedule from ${conflict.startTime} to ${conflict.endTime}`,
      409
    );
  }
};

export const syncTechnicianStatus = async (technicianId: string) => {
  const technician = await Technician.findById(technicianId);

  if (!technician || technician.status === "INACTIVE" || technician.status === "ON_LEAVE") {
    return technician;
  }

  const [scheduleCount, complaintCount, maintenanceCount] = await Promise.all([
    Schedule.countDocuments({
      technician: technician._id,
      status: { $in: activeScheduleStatuses },
    }),
    Complaint.countDocuments({
      assignedStaff: technician.userId,
      status: { $in: workloadComplaintStatuses },
    }),
    Maintenance.countDocuments({
      assignedStaff: technician.userId,
      status: { $in: workloadMaintenanceStatuses },
    }),
  ]);

  const nextStatus = getNextTechnicianStatus(scheduleCount, complaintCount, maintenanceCount);

  if (technician.status === nextStatus) {
    return technician;
  }

  return Technician.findByIdAndUpdate(
    technician._id,
    { $set: { status: nextStatus } },
    { new: true, runValidators: true }
  );
};

const resolveComplaintWork = async (
  complaintId: string,
  technician: { userId: string; apartmentId?: string | null },
  user: AuthenticatedScheduleUser
): Promise<WorkResolution> => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  assertManagerCanManageApartment(user, complaint.apartment);

  if (!activeComplaintStatuses.has(complaint.status)) {
    throw new AppError(`Complaint cannot be scheduled while it is ${complaint.status}`, 400);
  }

  if (
    technician.apartmentId &&
    complaint.apartment &&
    technician.apartmentId !== complaint.apartment
  ) {
    throw new AppError("Technician does not belong to the complaint apartment", 400);
  }

  let work = complaint;

  if (!sameId(complaint.assignedStaff, technician.userId)) {
    work = await assignComplaint(
      complaintId,
      {
        assignedStaff: technician.userId,
        remarks: "Scheduled work assignment",
      },
      user
    );
  }

  return {
    workType: "complaint",
    complaint: new Types.ObjectId(complaintId),
    maintenance: null,
    apartment: work.apartment,
    flat: work.flat,
    title: work.title,
    description: work.description ?? null,
    priority: work.priority,
  };
};

const resolveMaintenanceWork = async (
  maintenanceId: string,
  technician: { userId: string; apartmentId?: string | null },
  user: AuthenticatedScheduleUser
): Promise<WorkResolution> => {
  const maintenance = await Maintenance.findById(maintenanceId);

  if (!maintenance) {
    throw new AppError("Maintenance not found", 404);
  }

  assertManagerCanManageApartment(user, maintenance.apartment);

  if (!activeMaintenanceStatuses.has(maintenance.status)) {
    throw new AppError(`Maintenance cannot be scheduled while it is ${maintenance.status}`, 400);
  }

  if (
    technician.apartmentId &&
    maintenance.apartment &&
    technician.apartmentId !== maintenance.apartment
  ) {
    throw new AppError("Technician does not belong to the maintenance apartment", 400);
  }

  let work = maintenance;

  if (!sameId(maintenance.assignedStaff, technician.userId)) {
    work = await assignMaintenance(
      maintenanceId,
      {
        assignedStaff: technician.userId,
        remarks: "Scheduled work assignment",
      },
      user
    );
  }

  return {
    workType: "maintenance",
    complaint: new Types.ObjectId(getMongoId(work.complaint)),
    maintenance: new Types.ObjectId(maintenanceId),
    apartment: work.apartment,
    flat: work.flat,
    title: work.title,
    description: work.description ?? null,
    priority: work.priority,
  };
};

export const resolveWork = async (
  workType: ScheduleWorkType,
  workId: string,
  technician: { userId: string; apartmentId?: string | null },
  user: AuthenticatedScheduleUser
): Promise<WorkResolution> => {
  if (workType === "complaint") {
    return resolveComplaintWork(workId, technician, user);
  }

  return resolveMaintenanceWork(workId, technician, user);
};

export const buildScheduleSummary = async (filter: ScheduleFilter) => {
  const today = getDateBounds(new Date());
  const now = new Date();

  const [total, todayCount, upcoming, inProgress, completed, cancelled, scheduled, rescheduled] =
    await Promise.all([
      Schedule.countDocuments(filter),
      Schedule.countDocuments({
        ...filter,
        startAt: { $gte: today.start, $lte: today.end },
      }),
      Schedule.countDocuments({
        ...filter,
        startAt: { $gte: now },
        status: { $in: activeScheduleStatuses },
      }),
      Schedule.countDocuments({ ...filter, status: "IN_PROGRESS" }),
      Schedule.countDocuments({ ...filter, status: "COMPLETED" }),
      Schedule.countDocuments({ ...filter, status: "CANCELLED" }),
      Schedule.countDocuments({ ...filter, status: "SCHEDULED" }),
      Schedule.countDocuments({ ...filter, status: "RESCHEDULED" }),
    ]);

  return {
    total,
    today: todayCount,
    upcoming,
    inProgress,
    completed,
    cancelled,
    scheduled,
    rescheduled,
  };
};

export const syncWorkStatusFromSchedule = async (
  schedule: {
    workType: ScheduleWorkType;
    complaint?: unknown;
    maintenance?: unknown;
  },
  data: UpdateScheduleStatusInput,
  user: AuthenticatedScheduleUser
) => {
  if (data.status === "IN_PROGRESS") {
    if (schedule.workType === "complaint") {
      await updateComplaintStatus(
        getMongoId(schedule.complaint),
        {
          status: "IN_PROGRESS",
          remarks: data.notes,
        },
        user
      );
      return;
    }

    await startMaintenance(
      getMongoId(schedule.maintenance),
      {
        remarks: data.notes,
      },
      user
    );
    return;
  }

  if (data.status === "COMPLETED") {
    if (!data.completionDetails) {
      throw new AppError("Completion details are required to complete a schedule", 400);
    }

    if (schedule.workType === "complaint") {
      await completeComplaintWork(
        getMongoId(schedule.complaint),
        {
          completionDetails: data.completionDetails,
          finalCost: data.finalCost,
          remarks: data.notes,
        },
        user
      );
      return;
    }

    await completeMaintenance(
      getMongoId(schedule.maintenance),
      {
        completionDetails: data.completionDetails,
        finalCost: data.finalCost,
        workNotes: data.notes,
        remarks: data.notes,
      },
      user
    );
  }
};
