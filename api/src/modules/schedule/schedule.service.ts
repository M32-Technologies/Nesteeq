import { ObjectId, type Filter } from "mongodb";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { createAlert } from "../alert/alert.service.js";
import {
  assignComplaint,
  completeComplaintWork,
  updateComplaintStatus,
} from "../complaint/complaint.service.js";
import {
  Complaint,
  type ComplaintStatus,
} from "../complaint/complaint.model.js";
import {
  assignMaintenance,
  completeMaintenance,
  startMaintenance,
} from "../maintenance/maintenance.service.js";
import {
  Maintenance,
  type MaintenanceStatus,
} from "../maintenance/maintenance.model.js";
import {
  Technician,
  type TechnicianStatus,
} from "../technician/technician.model.js";
import {
  Schedule,
  type ScheduleStatus,
  type ScheduleWorkType,
} from "./schedule.model.js";
import type {
  CancelScheduleInput,
  CreateScheduleInput,
  GetSchedulesQuery,
  RescheduleInput,
  UpdateScheduleInput,
  UpdateScheduleStatusInput,
} from "./schedule.schema.js";

export type AuthenticatedScheduleUser = {
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

type ScheduleFilter = Record<string, unknown>;

type TimeWindow = {
  scheduledDate: Date;
  startAt: Date;
  endAt: Date;
  startTime: string;
  endTime: string;
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

const managementRoles = new Set(["ADMIN", "SUPER_ADMIN", "PROPERTY_MANAGER", "FACILITY_MANAGER"]);
const globalManagementRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const maintenanceRoles = new Set(["MAINTENANCE_STAFF", "MAINTENANCE_TECHNICIAN", "TECHNICIAN"]);

const activeScheduleStatuses: ScheduleStatus[] = ["SCHEDULED", "IN_PROGRESS", "RESCHEDULED"];
const editableScheduleStatuses = new Set<ScheduleStatus>(["SCHEDULED", "RESCHEDULED"]);
const scheduleTerminalStatuses = new Set<ScheduleStatus>(["COMPLETED", "CANCELLED"]);

const activeComplaintStatuses = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
]);

const activeMaintenanceStatuses = new Set<MaintenanceStatus>([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "REJECTED",
]);

const workloadComplaintStatuses: ComplaintStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

const workloadMaintenanceStatuses: MaintenanceStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

const normalizeRole = (role: string | null | undefined): string =>
  (role ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isManagementRole = (role: string): boolean => managementRoles.has(normalizeRole(role));
const isGlobalManagementRole = (role: string): boolean => globalManagementRoles.has(normalizeRole(role));
const isMaintenanceRole = (role: string): boolean => maintenanceRoles.has(normalizeRole(role));

const sameId = (left: unknown, right: unknown): boolean =>
  String(left ?? "") === String(right ?? "");

const getMongoId = (value: unknown): string => String(value ?? "");

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

const ensureCurrentUserExists = async (user: AuthenticatedScheduleUser): Promise<void> => {
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

const getScheduleOrThrow = async (scheduleId: string) => {
  assertValidScheduleId(scheduleId);

  const schedule = await Schedule.findById(scheduleId);

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  return schedule;
};

const getTechnicianOrThrow = async (technicianId: string) => {
  if (!Types.ObjectId.isValid(technicianId)) {
    throw new AppError("Invalid technician ID", 400);
  }

  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new AppError("Technician not found", 404);
  }

  return technician;
};

const assertTechnicianIsAssignable = (technician: { status: string }): void => {
  if (technician.status === "INACTIVE") {
    throw new AppError("Inactive technicians cannot be scheduled", 400);
  }

  if (technician.status === "ON_LEAVE") {
    throw new AppError("Technicians on leave cannot be scheduled", 400);
  }
};

const assertManagerCanManageApartment = (
  user: AuthenticatedScheduleUser,
  apartmentId?: string | null
): void => {
  const role = normalizeRole(user.role);

  if (!managementRoles.has(role)) {
    throw new AppError("You do not have permission to manage schedules", 403);
  }

  const managerApartmentId = normalizeOptionalString(user.apartmentId);
  const targetApartmentId = normalizeOptionalString(apartmentId);

  if (!globalManagementRoles.has(role) && !managerApartmentId) {
    throw new AppError("Management user must be linked to an apartment", 403);
  }

  if (!globalManagementRoles.has(role) && targetApartmentId && managerApartmentId !== targetApartmentId) {
    throw new AppError("You do not have permission to manage schedules for this apartment", 403);
  }
};

const assertCanAccessSchedule = (
  user: AuthenticatedScheduleUser,
  schedule: {
    apartment?: string | null;
    technicianUserId?: string | null;
  }
): void => {
  if (isManagementRole(user.role)) {
    assertManagerCanManageApartment(user, schedule.apartment);
    return;
  }

  if (isMaintenanceRole(user.role) && sameId(schedule.technicianUserId, user.id)) {
    return;
  }

  throw new AppError("You do not have permission to access this schedule", 403);
};

const assertScheduleEditable = (status: ScheduleStatus): void => {
  if (!editableScheduleStatuses.has(status)) {
    throw new AppError(`Schedule cannot be edited while it is ${status}`, 400);
  }
};

const parseScheduleDate = (value: string | Date): Date => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Scheduled date must be valid", 400);
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const parseTimeParts = (time: string): { hours: number; minutes: number } => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new AppError("Time must use HH:mm format", 400);
  }

  return { hours, minutes };
};

const buildTimeWindow = (
  scheduledDate: string | Date,
  startTime: string,
  endTime: string
): TimeWindow => {
  const dateOnly = parseScheduleDate(scheduledDate);
  const startParts = parseTimeParts(startTime);
  const endParts = parseTimeParts(endTime);
  const startAt = new Date(dateOnly);
  const endAt = new Date(dateOnly);

  startAt.setHours(startParts.hours, startParts.minutes, 0, 0);
  endAt.setHours(endParts.hours, endParts.minutes, 0, 0);

  if (endAt <= startAt) {
    throw new AppError("End time must be after start time", 400);
  }

  return {
    scheduledDate: dateOnly,
    startAt,
    endAt,
    startTime,
    endTime,
  };
};

const getDateBounds = (value: string | Date) => {
  const start = parseScheduleDate(value);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const createHistoryEntry = (
  status: ScheduleStatus,
  user: AuthenticatedScheduleUser,
  note?: string | null
) => ({
  status,
  note: normalizeOptionalString(note) ?? null,
  by: user.id,
  role: normalizeRole(user.role),
  createdAt: new Date(),
});

const ensureNoTechnicianConflict = async ({
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

const syncTechnicianStatus = async (technicianId: string) => {
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

  const nextStatus: TechnicianStatus =
    scheduleCount + complaintCount + maintenanceCount > 0 ? "BUSY" : "ACTIVE";

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

const resolveWork = async (
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

const buildScheduleFilter = (
  query: GetSchedulesQuery,
  user: AuthenticatedScheduleUser
): ScheduleFilter => {
  const role = normalizeRole(user.role);
  const filter: ScheduleFilter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.workType) {
    filter.workType = query.workType;
  }

  if (query.technician) {
    filter.technician = new Types.ObjectId(query.technician);
  }

  if (query.date) {
    const { start, end } = getDateBounds(query.date);
    filter.startAt = { $gte: start, $lte: end };
  } else if (query.startDate || query.endDate) {
    const range: Record<string, Date> = {};

    if (query.startDate) {
      range.$gte = getDateBounds(query.startDate).start;
    }

    if (query.endDate) {
      range.$lte = getDateBounds(query.endDate).end;
    }

    filter.startAt = range;
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { title: search },
      { description: search },
      { technicianUserId: search },
      { apartment: search },
      { flat: search },
    ];
  }

  if (managementRoles.has(role)) {
    const managerApartmentId = normalizeOptionalString(user.apartmentId);

    if (!globalManagementRoles.has(role)) {
      if (!managerApartmentId) {
        throw new AppError("Management user must be linked to an apartment", 403);
      }

      filter.apartment = managerApartmentId;
    }
  } else if (maintenanceRoles.has(role)) {
    filter.technicianUserId = user.id;
  } else {
    throw new AppError("You do not have permission to access schedules", 403);
  }

  return filter;
};

const buildScheduleSummary = async (filter: ScheduleFilter) => {
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

export const createSchedule = async (
  data: CreateScheduleInput,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);
  assertManagerCanManageApartment(user, user.apartmentId);

  const technician = await getTechnicianOrThrow(data.technician);
  assertManagerCanManageApartment(user, technician.apartmentId);
  assertTechnicianIsAssignable(technician);

  const timeWindow = buildTimeWindow(data.scheduledDate, data.startTime, data.endTime);
  await ensureNoTechnicianConflict({
    technicianId: data.technician,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
  });

  const workId = data.workType === "complaint" ? data.complaint : data.maintenance;

  if (!workId) {
    throw new AppError("Schedule work reference is required", 400);
  }

  const work = await resolveWork(data.workType, workId, technician, user);

  const schedule = await Schedule.create({
    title: data.title || work.title,
    description: data.description ?? work.description,
    technician: technician._id,
    technicianUserId: technician.userId,
    workType: work.workType,
    complaint: work.complaint,
    maintenance: work.maintenance,
    apartment: work.apartment,
    flat: work.flat,
    scheduledDate: timeWindow.scheduledDate,
    startTime: timeWindow.startTime,
    endTime: timeWindow.endTime,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
    priority: data.priority ?? work.priority,
    status: "SCHEDULED",
    notes: data.notes ?? null,
    statusHistory: [createHistoryEntry("SCHEDULED", user, data.notes)],
    createdBy: user.id,
    updatedBy: user.id,
  });

  await syncTechnicianStatus(getMongoId(technician._id));

  await createAlert({
    apartment: schedule.apartment,
    recipientUserId: schedule.technicianUserId,
    type: "SCHEDULE_CREATED",
    severity: schedule.priority === "URGENT" ? "WARNING" : "INFO",
    title: "Work scheduled",
    message: `${schedule.title} is scheduled on ${schedule.startTime}-${schedule.endTime}.`,
    relatedResourceType: "schedule",
    relatedResourceId: String(schedule._id),
    createdBy: user.id,
  });

  return schedule;
};

export const getSchedules = async (
  query: GetSchedulesQuery,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const filter = buildScheduleFilter(query, user);
  const skip = (query.page - 1) * query.limit;

  const [schedules, total, summary] = await Promise.all([
    Schedule.find(filter).sort({ startAt: 1 }).skip(skip).limit(query.limit).lean(),
    Schedule.countDocuments(filter),
    buildScheduleSummary(filter),
  ]);

  return {
    schedules,
    summary,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getMySchedules = async (
  query: GetSchedulesQuery,
  user: AuthenticatedScheduleUser
) => {
  if (!isMaintenanceRole(user.role)) {
    throw new AppError("Only technicians can view their own schedule", 403);
  }

  return getSchedules(query, user);
};

export const getScheduleById = async (
  scheduleId: string,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertCanAccessSchedule(user, schedule);

  return schedule;
};

export const updateSchedule = async (
  scheduleId: string,
  data: UpdateScheduleInput,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertManagerCanManageApartment(user, schedule.apartment);
  assertScheduleEditable(schedule.status);

  const previousTechnicianId = getMongoId(schedule.technician);
  const nextTechnicianId = data.technician ?? previousTechnicianId;
  const technician = await getTechnicianOrThrow(nextTechnicianId);
  assertManagerCanManageApartment(user, technician.apartmentId);
  assertTechnicianIsAssignable(technician);

  const nextDate = data.scheduledDate ?? schedule.scheduledDate;
  const nextStartTime = data.startTime ?? schedule.startTime;
  const nextEndTime = data.endTime ?? schedule.endTime;
  const timeWindow = buildTimeWindow(nextDate, nextStartTime, nextEndTime);

  await ensureNoTechnicianConflict({
    technicianId: nextTechnicianId,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
    excludeScheduleId: scheduleId,
  });

  const nextWorkType = (data.workType ?? schedule.workType) as ScheduleWorkType;
  const nextWorkId =
    nextWorkType === "complaint"
      ? data.complaint ?? getMongoId(schedule.complaint)
      : data.maintenance ?? getMongoId(schedule.maintenance);

  if (!Types.ObjectId.isValid(nextWorkId)) {
    throw new AppError("Schedule work reference is required", 400);
  }

  const work =
    data.workType || data.complaint || data.maintenance || data.technician
      ? await resolveWork(nextWorkType, nextWorkId, technician, user)
      : null;

  const set: Record<string, unknown> = {
    updatedBy: user.id,
    technician: technician._id,
    technicianUserId: technician.userId,
    scheduledDate: timeWindow.scheduledDate,
    startTime: timeWindow.startTime,
    endTime: timeWindow.endTime,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
  };

  if (data.title !== undefined) set.title = data.title;
  if (data.description !== undefined) set.description = data.description;
  if (data.priority !== undefined) set.priority = data.priority;
  if (data.notes !== undefined) set.notes = data.notes;

  if (work) {
    set.workType = work.workType;
    set.complaint = work.complaint;
    set.maintenance = work.maintenance;
    set.apartment = work.apartment;
    set.flat = work.flat;
  }

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    { $set: set },
    { new: true, runValidators: true }
  );

  if (!updatedSchedule) {
    throw new AppError("Schedule not found", 404);
  }

  await Promise.all([
    syncTechnicianStatus(previousTechnicianId),
    previousTechnicianId === nextTechnicianId
      ? Promise.resolve()
      : syncTechnicianStatus(nextTechnicianId),
  ]);

  await createAlert({
    apartment: updatedSchedule.apartment,
    recipientUserId: updatedSchedule.technicianUserId,
    type: "SCHEDULE_UPDATED",
    severity: "INFO",
    title: "Schedule updated",
    message: `${updatedSchedule.title} schedule details were updated.`,
    relatedResourceType: "schedule",
    relatedResourceId: scheduleId,
    createdBy: user.id,
  });

  return updatedSchedule;
};

export const rescheduleSchedule = async (
  scheduleId: string,
  data: RescheduleInput,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertManagerCanManageApartment(user, schedule.apartment);
  assertScheduleEditable(schedule.status);

  const previousTechnicianId = getMongoId(schedule.technician);
  const nextTechnicianId = data.technician ?? previousTechnicianId;
  const technician = await getTechnicianOrThrow(nextTechnicianId);
  assertManagerCanManageApartment(user, technician.apartmentId);
  assertTechnicianIsAssignable(technician);

  const timeWindow = buildTimeWindow(data.scheduledDate, data.startTime, data.endTime);

  await ensureNoTechnicianConflict({
    technicianId: nextTechnicianId,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
    excludeScheduleId: scheduleId,
  });

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    {
      $set: {
        technician: technician._id,
        technicianUserId: technician.userId,
        scheduledDate: timeWindow.scheduledDate,
        startTime: timeWindow.startTime,
        endTime: timeWindow.endTime,
        startAt: timeWindow.startAt,
        endAt: timeWindow.endAt,
        status: "RESCHEDULED",
        notes: data.notes ?? schedule.notes,
        updatedBy: user.id,
      },
      $push: {
        statusHistory: createHistoryEntry("RESCHEDULED", user, data.notes),
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedSchedule) {
    throw new AppError("Schedule not found", 404);
  }

  await Promise.all([
    syncTechnicianStatus(previousTechnicianId),
    previousTechnicianId === nextTechnicianId
      ? Promise.resolve()
      : syncTechnicianStatus(nextTechnicianId),
  ]);

  await createAlert({
    apartment: updatedSchedule.apartment,
    recipientUserId: updatedSchedule.technicianUserId,
    type: "SCHEDULE_UPDATED",
    severity: "INFO",
    title: "Schedule rescheduled",
    message: `${updatedSchedule.title} was rescheduled to ${updatedSchedule.startTime}-${updatedSchedule.endTime}.`,
    relatedResourceType: "schedule",
    relatedResourceId: scheduleId,
    createdBy: user.id,
  });

  return updatedSchedule;
};

export const cancelSchedule = async (
  scheduleId: string,
  data: CancelScheduleInput,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertManagerCanManageApartment(user, schedule.apartment);

  if (schedule.status === "CANCELLED") {
    return schedule;
  }

  if (schedule.status === "COMPLETED") {
    throw new AppError("Completed schedules cannot be cancelled", 400);
  }

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: data.reason ?? null,
        cancelledBy: user.id,
        cancelledAt: new Date(),
        updatedBy: user.id,
      },
      $push: {
        statusHistory: createHistoryEntry("CANCELLED", user, data.reason),
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedSchedule) {
    throw new AppError("Schedule not found", 404);
  }

  await syncTechnicianStatus(getMongoId(schedule.technician));

  await createAlert({
    apartment: updatedSchedule.apartment,
    recipientUserId: updatedSchedule.technicianUserId,
    type: "SCHEDULE_CANCELLED",
    severity: "WARNING",
    title: "Schedule cancelled",
    message: `${updatedSchedule.title} was cancelled.`,
    relatedResourceType: "schedule",
    relatedResourceId: scheduleId,
    createdBy: user.id,
  });

  return updatedSchedule;
};

const syncWorkStatusFromSchedule = async (
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

export const updateScheduleStatus = async (
  scheduleId: string,
  data: UpdateScheduleStatusInput,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertCanAccessSchedule(user, schedule);

  if (!isMaintenanceRole(user.role) || !sameId(schedule.technicianUserId, user.id)) {
    throw new AppError("Only the assigned technician can update schedule progress", 403);
  }

  if (data.status === "CANCELLED") {
    throw new AppError("Use the cancel schedule endpoint to cancel schedules", 400);
  }

  if (data.status === "RESCHEDULED") {
    throw new AppError("Use the reschedule endpoint to reschedule schedules", 400);
  }

  if (data.status === "SCHEDULED") {
    throw new AppError("Schedule cannot be moved back to scheduled", 400);
  }

  if (scheduleTerminalStatuses.has(schedule.status)) {
    throw new AppError(`Schedule cannot be updated while it is ${schedule.status}`, 400);
  }

  if (data.status === "IN_PROGRESS" && !["SCHEDULED", "RESCHEDULED"].includes(schedule.status)) {
    throw new AppError(`Schedule cannot start while it is ${schedule.status}`, 400);
  }

  if (data.status === "COMPLETED" && schedule.status !== "IN_PROGRESS") {
    throw new AppError("Only in-progress schedules can be completed", 400);
  }

  await syncWorkStatusFromSchedule(schedule, data, user);

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    {
      $set: {
        status: data.status,
        notes: data.notes ?? schedule.notes,
        completionDetails: data.status === "COMPLETED" ? data.completionDetails : schedule.completionDetails,
        updatedBy: user.id,
      },
      $push: {
        statusHistory: createHistoryEntry(data.status, user, data.notes),
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedSchedule) {
    throw new AppError("Schedule not found", 404);
  }

  await syncTechnicianStatus(getMongoId(schedule.technician));

  await createAlert({
    apartment: updatedSchedule.apartment,
    recipientRole: "FACILITY_MANAGER",
    type: data.status === "COMPLETED" ? "WORK_COMPLETED" : "MAINTENANCE_STATUS_UPDATED",
    severity: data.status === "COMPLETED" ? "SUCCESS" : "INFO",
    title: "Schedule status updated",
    message: `${updatedSchedule.title} was updated to ${data.status.toLowerCase().replace("_", " ")}.`,
    relatedResourceType: "schedule",
    relatedResourceId: scheduleId,
    createdBy: user.id,
  });

  return updatedSchedule;
};

export const deleteSchedule = async (
  scheduleId: string,
  user: AuthenticatedScheduleUser
) => {
  await ensureCurrentUserExists(user);

  const schedule = await getScheduleOrThrow(scheduleId);
  assertManagerCanManageApartment(user, schedule.apartment);

  if (schedule.status !== "CANCELLED") {
    throw new AppError("Cancel the schedule before deleting it", 400);
  }

  await Schedule.findByIdAndDelete(scheduleId);
  await syncTechnicianStatus(getMongoId(schedule.technician));

  return schedule;
};
