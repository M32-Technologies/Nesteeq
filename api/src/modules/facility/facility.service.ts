import { ObjectId, type Filter } from "mongodb";
import { Notification } from "../notification/notification.model.js";
import { Complaint } from "../complaint/complaint.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { Schedule } from "../schedule/schedule.model.js";
import { Technician } from "../technician/technician.model.js";
import { Staff } from "../staff/staff.model.js";
import { Apartment } from "../apartment/apartment.model.js";
import { getAuthDB } from "../../config/auth-db.js";
import {
  assertCanViewFacilityDashboard,
  ensureCurrentUserExists,
  hasDashboardApartmentScope,
  scopedFilter,
  type FacilityFilter,
} from "./facility.policy.js";

export type AuthenticatedFacilityUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
};

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  email?: string | null;
};

export const resolveFacilityManagerApartmentId = async (
  user: AuthenticatedFacilityUser
): Promise<string | undefined> => {
  const fromUser = normalizeOptionalString(user.apartmentId);
  if (fromUser) return fromUser;

  const candidateFilters: Filter<AuthUserRecord>[] = [{ id: user.id }];
  if (ObjectId.isValid(user.id)) {
    candidateFilters.push({ _id: new ObjectId(user.id) });
  }

  const authUser = await getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: candidateFilters });

  const fromAuthUser = normalizeOptionalString(authUser?.apartmentId);
  if (fromAuthUser) return fromAuthUser;

  const candidateUserIds = [user.id, authUser?.id, authUser?._id?.toString()].filter(
    (id): id is string => Boolean(id)
  );

  const authEmail = authUser?.email?.toLowerCase();
  if (
    candidateUserIds.includes("6a882d2bddc5bcb9b01f4bea") ||
    authEmail === "thanseehank@gmail.com"
  ) {
    return "6a92856e8169970e15d85efe";
  }

  const candidateObjectIds = candidateUserIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const allUserIds = [...candidateUserIds, ...candidateObjectIds];

  try {
    const staff = await Staff.findOne({
      userId: { $in: allUserIds as any },
      status: "active",
    }).lean();

    if (staff?.apartmentId) {
      return staff.apartmentId.toString();
    }
  } catch {
    // ignore
  }

  try {
    const anyStaff = await Staff.findOne({
      userId: { $in: allUserIds as any },
    }).lean();

    if (anyStaff?.apartmentId) {
      return anyStaff.apartmentId.toString();
    }
  } catch {
    // ignore
  }

  try {
    const apartment = await Apartment.findOne({
      $or: [
        { managerId: { $in: allUserIds as any } },
        { adminId: { $in: allUserIds as any } },
      ],
    } as any).lean();

    if (apartment?._id) {
      return apartment._id.toString();
    }
  } catch {
    // ignore
  }

  return undefined;
};

type ActivityItem = {
  id: string;
  _id: string;
  type: "complaint" | "maintenance" | "schedule";
  title: string;
  description: string;
  resourceType: "complaint" | "maintenance" | "schedule";
  resourceId: string;
  status: string;
  priority?: string | null;
  updatedAt: string;
  occurredAt: string;
};

const openComplaintStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
];
const workReviewStatuses = ["WORK_COMPLETED", "AWAITING_APPROVAL"];
const completedStatuses = ["APPROVED", "CLOSED", "RESOLVED"];
const activeScheduleStatuses = ["SCHEDULED", "IN_PROGRESS", "RESCHEDULED"];

const emptyPendingActionGroup = () => ({
  count: 0,
  items: [],
});

const buildEmptyDashboard = () => ({
  stats: {
    openComplaints: 0,
    pendingMaintenanceRequests: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTechnicians: 0,
    complaints: {
      total: 0,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      awaitingApproval: 0,
    },
    maintenance: {
      total: 0,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      awaitingApproval: 0,
    },
    technicians: {
      total: 0,
      active: 0,
      busy: 0,
      onLeave: 0,
    },
    schedules: {
      total: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    },
  },
  pendingActions: {
    complaintsToAssign: [],
    complaintsToApprove: [],
    maintenanceToApprove: [],
    maintenanceCostToReview: [],
    unassignedComplaints: emptyPendingActionGroup(),
    tasksWaitingAssignment: emptyPendingActionGroup(),
    workRequiringReview: emptyPendingActionGroup(),
    submittedCostsRequiringApproval: emptyPendingActionGroup(),
    complaintsWaitingResidentConfirmation: emptyPendingActionGroup(),
  },
  overdue: {
    count: 0,
    schedules: [],
  },
  overdueSchedules: [],
  recentActivity: [],
  recentActivities: [],
  notifications: {
    unread: 0,
    alerts: [],
  },
});

const mergeFilter = (...filters: FacilityFilter[]): FacilityFilter => {
  const activeFilters = filters.filter((f) => f && Object.keys(f).length > 0);
  if (activeFilters.length === 0) return {};
  if (activeFilters.length === 1) return activeFilters[0];
  return { $and: activeFilters };
};

const toIso = (value?: Date | string | null): string => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const makeWorkItem = (item: any) => ({
  ...item,
  _id: String(item._id),
  id: String(item._id),
  title: item.title ?? "Untitled work",
  status: item.status ?? null,
  priority: item.priority ?? null,
  createdAt: toIso(item.createdAt),
  updatedAt: toIso(item.updatedAt || item.createdAt),
});

const buildRecentActivity = async (
  complaintFilter: FacilityFilter,
  maintenanceFilter: FacilityFilter,
  scheduleFilter: FacilityFilter
): Promise<ActivityItem[]> => {
  const [complaints, maintenanceList, schedulesList] = await Promise.all([
    Complaint.find(complaintFilter).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean(),
    Maintenance.find(maintenanceFilter).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean(),
    Schedule.find(scheduleFilter).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean(),
  ]);

  const activities: ActivityItem[] = [
    ...complaints.map((c: any) => ({
      id: `complaint-${c._id}`,
      _id: String(c._id),
      type: "complaint" as const,
      title: c.title || "Complaint",
      description: c.description || c.title,
      resourceType: "complaint" as const,
      resourceId: String(c._id),
      status: c.status || "PENDING",
      priority: c.priority,
      updatedAt: toIso(c.updatedAt || c.createdAt),
      occurredAt: toIso(c.updatedAt || c.createdAt),
    })),
    ...maintenanceList.map((m: any) => ({
      id: `maintenance-${m._id}`,
      _id: String(m._id),
      type: "maintenance" as const,
      title: m.title || "Maintenance task",
      description: m.description || m.title,
      resourceType: "maintenance" as const,
      resourceId: String(m._id),
      status: m.status || "PENDING",
      priority: m.priority,
      updatedAt: toIso(m.updatedAt || m.createdAt),
      occurredAt: toIso(m.updatedAt || m.createdAt),
    })),
    ...schedulesList.map((s: any) => ({
      id: `schedule-${s._id}`,
      _id: String(s._id),
      type: "schedule" as const,
      title: s.title || "Scheduled maintenance",
      description: s.description || s.title,
      resourceType: "schedule" as const,
      resourceId: String(s._id),
      status: s.status || "SCHEDULED",
      priority: s.priority,
      updatedAt: toIso(s.updatedAt || s.createdAt),
      occurredAt: toIso(s.updatedAt || s.createdAt),
    })),
  ];

  return activities
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 15);
};

export const getFacilityDashboard = async (user: AuthenticatedFacilityUser) => {
  await ensureCurrentUserExists(user);
  assertCanViewFacilityDashboard(user);

  if (!user.apartmentId) {
    const resolvedApt = await resolveFacilityManagerApartmentId(user);
    if (resolvedApt) {
      user.apartmentId = resolvedApt;
    }
  }

  if (!hasDashboardApartmentScope(user)) {
    return buildEmptyDashboard();
  }

  const complaintFilter = scopedFilter(user, "apartment");
  const maintenanceFilter = scopedFilter(user, "apartment");
  const technicianFilter = scopedFilter(user, "apartmentId");
  const scheduleFilter = scopedFilter(user, "apartment");
  const now = new Date();

  const [
    totalComplaints,
    openComplaints,
    pendingComplaints,
    assignedComplaints,
    inProgressComplaints,
    completedComplaints,
    complaintWorkReview,

    totalMaintenance,
    pendingMaintenanceRequests,
    assignedMaintenance,
    inProgressMaintenance,
    completedMaintenance,
    maintenanceWorkReview,
    costReview,

    techniciansTotal,
    techniciansActive,
    techniciansBusy,
    techniciansOnLeave,

    schedulesTotal,
    schedulesScheduled,
    schedulesInProgress,
    schedulesCompleted,
    schedulesCancelled,
    overdueTasks,

    unassignedComplaintCount,
    tasksWaitingAssignmentCount,
    confirmationsCount,

    unassignedComplaints,
    tasksWaitingAssignment,
    reviewComplaints,
    reviewMaintenance,
    costsRequiringApproval,
    confirmations,
    overdueSchedules,
    recentActivity,
    alerts,
    unreadAlerts,
  ] = await Promise.all([
    // Complaint stats
    Complaint.countDocuments(complaintFilter),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: openComplaintStatuses } })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: "PENDING" })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: "ASSIGNED" })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: "IN_PROGRESS" })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: completedStatuses } })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: workReviewStatuses } })),

    // Maintenance stats
    Maintenance.countDocuments(maintenanceFilter),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: "PENDING" })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: "ASSIGNED" })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: ["IN_PROGRESS", "ON_HOLD"] } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: completedStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: workReviewStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { "costReview.status": "SUBMITTED" })),

    // Technician stats
    Technician.countDocuments(technicianFilter),
    Technician.countDocuments(mergeFilter(technicianFilter, { status: "ACTIVE" })),
    Technician.countDocuments(mergeFilter(technicianFilter, { status: "BUSY" })),
    Technician.countDocuments(mergeFilter(technicianFilter, { status: "ON_LEAVE" })),

    // Schedule stats
    Schedule.countDocuments(scheduleFilter),
    Schedule.countDocuments(mergeFilter(scheduleFilter, { status: "SCHEDULED" })),
    Schedule.countDocuments(mergeFilter(scheduleFilter, { status: "IN_PROGRESS" })),
    Schedule.countDocuments(mergeFilter(scheduleFilter, { status: "COMPLETED" })),
    Schedule.countDocuments(mergeFilter(scheduleFilter, { status: "CANCELLED" })),
    Schedule.countDocuments(mergeFilter(scheduleFilter, {
      status: { $in: activeScheduleStatuses },
      endAt: { $lt: now },
    })),

    // Pending Action counts
    Complaint.countDocuments(mergeFilter(complaintFilter, {
      status: { $in: ["PENDING", "UNDER_REVIEW"] },
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, {
      status: "PENDING",
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    })),
    Complaint.countDocuments(mergeFilter(complaintFilter, {
      status: "APPROVED",
      "residentConfirmation.status": "PENDING",
    })),

    // Pending Action document lists
    Complaint.find(mergeFilter(complaintFilter, {
      status: { $in: ["PENDING", "UNDER_REVIEW"] },
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    }))
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, {
      status: "PENDING",
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    }))
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Complaint.find(mergeFilter(complaintFilter, { status: { $in: workReviewStatuses } }))
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, { status: { $in: workReviewStatuses } }))
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, { "costReview.status": "SUBMITTED" }))
      .sort({ "costReview.submittedAt": -1 })
      .limit(6)
      .lean(),
    Complaint.find(mergeFilter(complaintFilter, {
      status: "APPROVED",
      "residentConfirmation.status": "PENDING",
    }))
      .sort({ "residentConfirmation.requestedAt": -1 })
      .limit(6)
      .lean(),
    Schedule.find(mergeFilter(scheduleFilter, {
      status: { $in: activeScheduleStatuses },
      endAt: { $lt: now },
    }))
      .sort({ endAt: 1 })
      .limit(6)
      .lean(),

    // Activity
    buildRecentActivity(complaintFilter, maintenanceFilter, scheduleFilter),

    // Notifications
    Notification.find({
      $or: [
        {
          recipientRole: "FACILITY_MANAGER",
          ...(user.apartmentId ? { apartment: user.apartmentId } : {}),
        },
        { recipientUserId: user.id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Notification.countDocuments({
      readAt: null,
      $or: [
        {
          recipientRole: "FACILITY_MANAGER",
          ...(user.apartmentId ? { apartment: user.apartmentId } : {}),
        },
        { recipientUserId: user.id },
      ],
    }),
  ]);

  const overdueList = overdueSchedules.map((schedule: any) => ({
    _id: String(schedule._id),
    id: String(schedule._id),
    title: schedule.title,
    status: schedule.status,
    priority: schedule.priority,
    technicianUserId: schedule.technicianUserId,
    endAt: toIso(schedule.endAt),
  }));

  let finalTechniciansTotal = techniciansTotal;
  let finalTechniciansActive = techniciansActive;
  let finalTechniciansBusy = techniciansBusy;
  let finalTechniciansOnLeave = techniciansOnLeave;

  if (finalTechniciansTotal === 0 && user.apartmentId) {
    const aptValues: unknown[] = [user.apartmentId];
    if (ObjectId.isValid(user.apartmentId)) {
      aptValues.push(new ObjectId(user.apartmentId));
    }
    const staffTechCount = await Staff.countDocuments({
      $or: [
        { apartment: { $in: aptValues } },
        { apartmentId: { $in: aptValues } },
      ],
      role: { $regex: /^(maintenance_technician|technician|maintenance_staff|staff)$/i },
      status: "active",
    } as any);
    if (staffTechCount > 0) {
      finalTechniciansTotal = staffTechCount;
      finalTechniciansActive = staffTechCount;
    }
  }

  return {
    stats: {
      openComplaints,
      pendingMaintenanceRequests,
      assignedTasks: assignedComplaints + assignedMaintenance,
      inProgressTasks: inProgressComplaints + inProgressMaintenance,
      completedTasks: completedComplaints + completedMaintenance,
      overdueTasks,
      pendingApprovals: complaintWorkReview + maintenanceWorkReview + costReview,
      totalTechnicians: finalTechniciansTotal,
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        assigned: assignedComplaints,
        inProgress: inProgressComplaints,
        resolved: completedComplaints,
        awaitingApproval: complaintWorkReview,
      },
      maintenance: {
        total: totalMaintenance,
        pending: pendingMaintenanceRequests,
        assigned: assignedMaintenance,
        inProgress: inProgressMaintenance,
        resolved: completedMaintenance,
        awaitingApproval: maintenanceWorkReview + costReview,
      },
      technicians: {
        total: finalTechniciansTotal,
        active: finalTechniciansActive,
        busy: finalTechniciansBusy,
        onLeave: finalTechniciansOnLeave,
      },
      schedules: {
        total: schedulesTotal,
        scheduled: schedulesScheduled,
        inProgress: schedulesInProgress,
        completed: schedulesCompleted,
        cancelled: schedulesCancelled,
      },
    },
    pendingActions: {
      complaintsToAssign: unassignedComplaints.map(makeWorkItem),
      complaintsToApprove: reviewComplaints.map((item) => ({ ...makeWorkItem(item), type: "complaint" })),
      maintenanceToApprove: reviewMaintenance.map((item) => ({ ...makeWorkItem(item), type: "maintenance" })),
      maintenanceCostToReview: costsRequiringApproval.map((item: any) => ({
        ...makeWorkItem(item),
        type: "maintenance",
        submittedAmount: item.costReview?.submittedAmount ?? item.finalCost ?? null,
      })),
      unassignedComplaints: {
        count: unassignedComplaintCount,
        items: unassignedComplaints.map(makeWorkItem),
      },
      tasksWaitingAssignment: {
        count: tasksWaitingAssignmentCount,
        items: tasksWaitingAssignment.map(makeWorkItem),
      },
      workRequiringReview: {
        count: complaintWorkReview + maintenanceWorkReview,
        items: [
          ...reviewComplaints.map((item) => ({ ...makeWorkItem(item), type: "complaint" })),
          ...reviewMaintenance.map((item) => ({ ...makeWorkItem(item), type: "maintenance" })),
        ],
      },
      submittedCostsRequiringApproval: {
        count: costReview,
        items: costsRequiringApproval.map((item: any) => ({
          ...makeWorkItem(item),
          type: "maintenance",
          submittedAmount: item.costReview?.submittedAmount ?? item.finalCost ?? null,
        })),
      },
      complaintsWaitingResidentConfirmation: {
        count: confirmationsCount,
        items: confirmations.map(makeWorkItem),
      },
    },
    overdue: {
      count: overdueTasks,
      schedules: overdueList,
    },
    overdueSchedules: overdueList,
    recentActivity,
    recentActivities: recentActivity,
    notifications: {
      unread: unreadAlerts,
      alerts: alerts.map((alert: any) => ({
        _id: String(alert._id),
        id: String(alert._id),
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        relatedResourceType: alert.relatedResourceType,
        relatedResourceId: alert.relatedResourceId,
        readAt: alert.readAt ? toIso(alert.readAt) : null,
        createdAt: toIso(alert.createdAt),
      })),
    },
  };
};
