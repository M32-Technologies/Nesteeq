import { Notification } from "../notification/notification.model.js";
import { Complaint } from "../complaint/complaint.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { Schedule } from "../schedule/schedule.model.js";
import { Technician } from "../technician/technician.model.js";
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

type ActivityItem = {
  id: string;
  type:
    | "NEW_COMPLAINT"
    | "TECHNICIAN_UPDATE"
    | "WORK_COMPLETED"
    | "COST_SUBMITTED"
    | "RESIDENT_CONFIRMATION";
  title: string;
  description: string;
  resourceType: "complaint" | "maintenance";
  resourceId: string;
  occurredAt: string;
  status?: string | null;
  priority?: string | null;
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
const completedStatuses = ["APPROVED", "CLOSED"];
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
    pendingApprovals: 0,
    technicians: 0,
  },
  pendingActions: {
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
  recentActivity: [],
  notifications: {
    unread: 0,
    alerts: [],
  },
});

const mergeFilter = (...filters: FacilityFilter[]): FacilityFilter =>
  Object.assign({}, ...filters);

const toIso = (value?: Date | string | null): string => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const makeWorkItem = (item: {
  _id: unknown;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) => ({
  id: String(item._id),
  title: item.title ?? "Untitled work",
  status: item.status ?? null,
  priority: item.priority ?? null,
  createdAt: toIso(item.createdAt),
  updatedAt: toIso(item.updatedAt),
});

const buildRecentActivity = async (
  complaintFilter: FacilityFilter,
  maintenanceFilter: FacilityFilter
): Promise<ActivityItem[]> => {
  const [complaints, progressMaintenance, completedMaintenance, costSubmissions, confirmations] =
    await Promise.all([
      Complaint.find(complaintFilter).sort({ createdAt: -1 }).limit(6).lean(),
      Maintenance.find({
        ...maintenanceFilter,
        "progressUpdates.0": { $exists: true },
      })
        .sort({ updatedAt: -1 })
        .limit(12)
        .lean(),
      Maintenance.find({
        ...maintenanceFilter,
        completedAt: { $ne: null },
      })
        .sort({ completedAt: -1 })
        .limit(6)
        .lean(),
      Maintenance.find({
        ...maintenanceFilter,
        "costReview.status": "SUBMITTED",
      })
        .sort({ "costReview.submittedAt": -1 })
        .limit(6)
        .lean(),
      Complaint.find({
        ...complaintFilter,
        "residentConfirmation.status": "CONFIRMED",
      })
        .sort({ "residentConfirmation.confirmedAt": -1 })
        .limit(6)
        .lean(),
    ]);

  const activities: ActivityItem[] = [
    ...complaints.map((complaint) => ({
      id: `complaint-created-${complaint._id}`,
      type: "NEW_COMPLAINT" as const,
      title: "New complaint",
      description: complaint.title,
      resourceType: "complaint" as const,
      resourceId: String(complaint._id),
      occurredAt: toIso(complaint.createdAt),
      status: complaint.status,
      priority: complaint.priority,
    })),
    ...progressMaintenance.flatMap((maintenance) =>
      (maintenance.progressUpdates ?? []).slice(-3).map((progress) => ({
        id: `maintenance-progress-${maintenance._id}-${progress.createdAt}`,
        type: "TECHNICIAN_UPDATE" as const,
        title: "Technician update",
        description: progress.details,
        resourceType: "maintenance" as const,
        resourceId: String(maintenance._id),
        occurredAt: toIso(progress.createdAt),
        status: progress.status,
        priority: maintenance.priority,
      }))
    ),
    ...completedMaintenance.map((maintenance) => ({
      id: `maintenance-completed-${maintenance._id}`,
      type: "WORK_COMPLETED" as const,
      title: "Maintenance completed",
      description: maintenance.title,
      resourceType: "maintenance" as const,
      resourceId: String(maintenance._id),
      occurredAt: toIso(maintenance.completedAt),
      status: maintenance.status,
      priority: maintenance.priority,
    })),
    ...costSubmissions.map((maintenance) => ({
      id: `maintenance-cost-${maintenance._id}`,
      type: "COST_SUBMITTED" as const,
      title: "Cost submitted",
      description: maintenance.title,
      resourceType: "maintenance" as const,
      resourceId: String(maintenance._id),
      occurredAt: toIso(maintenance.costReview?.submittedAt),
      status: maintenance.costReview?.status ?? null,
      priority: maintenance.priority,
    })),
    ...confirmations.map((complaint) => ({
      id: `resident-confirmed-${complaint._id}`,
      type: "RESIDENT_CONFIRMATION" as const,
      title: "Resident confirmed",
      description: complaint.title,
      resourceType: "complaint" as const,
      resourceId: String(complaint._id),
      occurredAt: toIso(complaint.residentConfirmation?.confirmedAt),
      status: complaint.status,
      priority: complaint.priority,
    })),
  ];

  return activities
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 12);
};

export const getFacilityDashboard = async (user: AuthenticatedFacilityUser) => {
  await ensureCurrentUserExists(user);
  assertCanViewFacilityDashboard(user);

  if (!hasDashboardApartmentScope(user)) {
    return buildEmptyDashboard();
  }

  const complaintFilter = scopedFilter(user, "apartment");
  const maintenanceFilter = scopedFilter(user, "apartment");
  const technicianFilter = scopedFilter(user, "apartmentId");
  const scheduleFilter = scopedFilter(user, "apartment");
  const now = new Date();

  const [
    openComplaints,
    pendingMaintenanceRequests,
    assignedComplaints,
    assignedMaintenance,
    inProgressComplaints,
    inProgressMaintenance,
    completedComplaints,
    completedMaintenance,
    overdueTasks,
    complaintWorkReview,
    maintenanceWorkReview,
    costReview,
    technicians,
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
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: openComplaintStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: "PENDING" })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: "ASSIGNED" })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: "ASSIGNED" })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: "IN_PROGRESS" })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: ["IN_PROGRESS", "ON_HOLD"] } })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: completedStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: completedStatuses } })),
    Schedule.countDocuments(mergeFilter(scheduleFilter, {
      status: { $in: activeScheduleStatuses },
      endAt: { $lt: now },
    })),
    Complaint.countDocuments(mergeFilter(complaintFilter, { status: { $in: workReviewStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { status: { $in: workReviewStatuses } })),
    Maintenance.countDocuments(mergeFilter(maintenanceFilter, { "costReview.status": "SUBMITTED" })),
    Technician.countDocuments(technicianFilter),
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
    Complaint.find(mergeFilter(complaintFilter, {
      status: { $in: ["PENDING", "UNDER_REVIEW"] },
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    }))
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, {
      status: "PENDING",
      $or: [{ assignedStaff: null }, { assignedStaff: "" }],
    }))
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Complaint.find(mergeFilter(complaintFilter, { status: { $in: workReviewStatuses } }))
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, { status: { $in: workReviewStatuses } }))
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    Maintenance.find(mergeFilter(maintenanceFilter, { "costReview.status": "SUBMITTED" }))
      .sort({ "costReview.submittedAt": -1 })
      .limit(5)
      .lean(),
    Complaint.find(mergeFilter(complaintFilter, {
      status: "APPROVED",
      "residentConfirmation.status": "PENDING",
    }))
      .sort({ "residentConfirmation.requestedAt": -1 })
      .limit(5)
      .lean(),
    Schedule.find(mergeFilter(scheduleFilter, {
      status: { $in: activeScheduleStatuses },
      endAt: { $lt: now },
    }))
      .sort({ endAt: 1 })
      .limit(5)
      .lean(),
    buildRecentActivity(complaintFilter, maintenanceFilter),
    Notification.find({
      $or: [
        { recipientRole: "FACILITY_MANAGER", ...complaintFilter },
        { recipientUserId: user.id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Notification.countDocuments({
      readAt: null,
      $or: [
        { recipientRole: "FACILITY_MANAGER", ...complaintFilter },
        { recipientUserId: user.id },
      ],
    }),
  ]);

  return {
    stats: {
      openComplaints,
      pendingMaintenanceRequests,
      assignedTasks: assignedComplaints + assignedMaintenance,
      inProgressTasks: inProgressComplaints + inProgressMaintenance,
      completedTasks: completedComplaints + completedMaintenance,
      overdueTasks,
      pendingApprovals: complaintWorkReview + maintenanceWorkReview + costReview,
      technicians,
    },
    pendingActions: {
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
        items: costsRequiringApproval.map((item) => ({
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
      schedules: overdueSchedules.map((schedule) => ({
        id: String(schedule._id),
        title: schedule.title,
        status: schedule.status,
        priority: schedule.priority,
        technicianUserId: schedule.technicianUserId,
        endAt: toIso(schedule.endAt),
      })),
    },
    recentActivity,
    notifications: {
      unread: unreadAlerts,
      alerts: alerts.map((alert) => ({
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
