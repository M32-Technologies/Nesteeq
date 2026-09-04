import { Types } from "mongoose";

import {
  Complaint,
  complaintCategories,
  complaintStatuses,
  type ComplaintStatus,
} from "../complaint/complaint.model.js";
import {
  Maintenance,
  maintenanceStatuses,
  type MaintenanceStatus,
} from "../maintenance/maintenance.model.js";
import {
  Technician,
  technicianStatuses,
  type TechnicianStatus,
} from "../technician/technician.model.js";
import {
  applyApartmentScope,
  assertCanViewReports,
  ensureCurrentUserExists,
  type ReportFilter,
} from "./report.policy.js";
import type { ReportQuery } from "./report.schema.js";

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};


export type AuthenticatedReportUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
};

type CountResult = {
  _id: string | null;
  count: number;
};

type CostResult = {
  estimatedCost: number;
  finalCost: number;
  approvedCost: number;
  pendingCost: number;
};

type TechnicianWorkloadResult = {
  _id: string | null;
  assignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
};

const complaintCompletedStatuses = new Set<ComplaintStatus>(["APPROVED", "CLOSED"]);
const complaintPendingStatuses = new Set<ComplaintStatus>(["PENDING", "UNDER_REVIEW", "ASSIGNED"]);
const complaintInProgressStatuses = new Set<ComplaintStatus>([
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
]);

const maintenanceCompletedStatuses = new Set<MaintenanceStatus>(["APPROVED", "CLOSED"]);
const maintenancePendingStatuses = new Set<MaintenanceStatus>(["PENDING", "ASSIGNED"]);
const maintenanceInProgressStatuses = new Set<MaintenanceStatus>([
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
]);

const complaintPendingWorkStatuses = Array.from(
  new Set<ComplaintStatus>([
    ...Array.from(complaintPendingStatuses),
    ...Array.from(complaintInProgressStatuses),
  ])
);

const maintenancePendingWorkStatuses = Array.from(
  new Set<MaintenanceStatus>([
    ...Array.from(maintenancePendingStatuses),
    ...Array.from(maintenanceInProgressStatuses),
  ])
);

const getDateRange = (query: ReportQuery) => {
  const range: Record<string, Date> = {};

  if (query.startDate) {
    const startDate = new Date(query.startDate);
    startDate.setHours(0, 0, 0, 0);
    range.$gte = startDate;
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);
    range.$lte = endDate;
  }

  return Object.keys(range).length > 0 ? range : null;
};

const applyDateRange = (filter: ReportFilter, query: ReportQuery): void => {
  const dateRange = getDateRange(query);

  if (dateRange) {
    filter.createdAt = dateRange;
  }
};

const resolveTechnicianUserId = async (technician?: string): Promise<string | null> => {
  const value = normalizeOptionalString(technician);

  if (!value) {
    return null;
  }

  const filters: ReportFilter[] = [{ userId: value }];

  if (Types.ObjectId.isValid(value)) {
    filters.push({ _id: value });
  }

  const technicianRecord = await Technician.findOne({ $or: filters }).lean();

  return technicianRecord?.userId ?? value;
};

const buildComplaintFilter = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  const filter: ReportFilter = {};
  const technicianUserId = await resolveTechnicianUserId(query.technician);

  applyDateRange(filter, query);
  applyApartmentScope(filter, "apartment", query, user);

  if (query.category) filter.category = query.category;
  if (query.complaintStatus) filter.status = query.complaintStatus;
  if (technicianUserId) filter.assignedStaff = technicianUserId;

  return filter;
};

const buildMaintenanceFilter = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  const filter: ReportFilter = {};
  const technicianUserId = await resolveTechnicianUserId(query.technician);

  applyDateRange(filter, query);
  applyApartmentScope(filter, "apartment", query, user);

  if (query.category) filter.category = query.category;
  if (query.maintenanceStatus) filter.status = query.maintenanceStatus;
  if (technicianUserId) filter.assignedStaff = technicianUserId;

  return filter;
};

const buildTechnicianFilter = (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  const filter: ReportFilter = {};

  applyDateRange(filter, query);
  applyApartmentScope(filter, "apartmentId", query, user);

  if (query.technicianStatus) filter.status = query.technicianStatus;
  if (query.category) filter.specializations = query.category;
  if (query.technician) {
    filter.$or = Types.ObjectId.isValid(query.technician)
      ? [{ _id: query.technician }, { userId: query.technician }]
      : [{ userId: query.technician }];
  }

  return filter;
};

const hasFilterField = (filter: ReportFilter, field: string): boolean =>
  Object.prototype.hasOwnProperty.call(filter, field);

const buildUnassignedWorkFilter = (filter: ReportFilter): ReportFilter =>
  hasFilterField(filter, "assignedStaff")
    ? { ...filter, _id: { $in: [] } }
    : { ...filter, assignedStaff: null };

const buildAssignedWorkFilter = (filter: ReportFilter): ReportFilter =>
  hasFilterField(filter, "assignedStaff")
    ? filter
    : { ...filter, assignedStaff: { $exists: true, $ne: null } };

const applyPendingComplaintStatusScope = (
  filter: ReportFilter,
  query: ReportQuery
): void => {
  if (!query.complaintStatus) {
    filter.status = { $in: complaintPendingWorkStatuses };
    return;
  }

  if (!complaintPendingWorkStatuses.includes(query.complaintStatus)) {
    filter.status = { $in: [] };
  }
};

const applyPendingMaintenanceStatusScope = (
  filter: ReportFilter,
  query: ReportQuery
): void => {
  if (!query.maintenanceStatus) {
    filter.status = { $in: maintenancePendingWorkStatuses };
    return;
  }

  if (!maintenancePendingWorkStatuses.includes(query.maintenanceStatus)) {
    filter.status = { $in: [] };
  }
};

const countByField = async (
  model: typeof Complaint | typeof Maintenance | typeof Technician,
  filter: ReportFilter,
  field: string
) => {
  const rows = await model.aggregate<CountResult>([
    { $match: filter },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  return rows.reduce<Record<string, number>>((acc, row) => {
    if (row._id) acc[row._id] = row.count;
    return acc;
  }, {});
};

const countFromMap = <TStatus extends string>(
  counts: Record<string, number>,
  statuses: readonly TStatus[]
) => statuses.reduce((total, status) => total + (counts[status] ?? 0), 0);

const getCostSummary = async (
  model: typeof Complaint | typeof Maintenance,
  filter: ReportFilter,
  pendingStatuses: readonly string[],
  approvedStatuses: readonly string[]
) => {
  const rows = await model.aggregate<CostResult>([
    { $match: filter },
    {
      $group: {
        _id: null,
        estimatedCost: { $sum: { $ifNull: ["$estimatedCost", 0] } },
        finalCost: { $sum: { $ifNull: ["$finalCost", 0] } },
        approvedCost: {
          $sum: {
            $cond: [
              { $in: ["$status", approvedStatuses] },
              { $ifNull: ["$finalCost", 0] },
              0,
            ],
          },
        },
        pendingCost: {
          $sum: {
            $cond: [
              { $in: ["$status", pendingStatuses] },
              { $ifNull: ["$estimatedCost", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return rows[0] ?? {
    estimatedCost: 0,
    finalCost: 0,
    approvedCost: 0,
    pendingCost: 0,
  };
};

const getMaintenanceCostSummary = async (filter: ReportFilter) => {
  const rows = await Maintenance.aggregate<CostResult>([
    { $match: filter },
    {
      $group: {
        _id: null,
        estimatedCost: { $sum: { $ifNull: ["$estimatedCost", 0] } },
        finalCost: { $sum: { $ifNull: ["$finalCost", 0] } },
        approvedCost: {
          $sum: {
            $cond: [
              { $eq: ["$costReview.status", "APPROVED"] },
              { $ifNull: ["$costReview.submittedAmount", { $ifNull: ["$finalCost", 0] }] },
              0,
            ],
          },
        },
        pendingCost: {
          $sum: {
            $cond: [
              { $eq: ["$costReview.status", "SUBMITTED"] },
              { $ifNull: ["$costReview.submittedAmount", { $ifNull: ["$finalCost", 0] }] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return rows[0] ?? {
    estimatedCost: 0,
    finalCost: 0,
    approvedCost: 0,
    pendingCost: 0,
  };
};

const getTechnicianWorkload = async (
  model: typeof Complaint | typeof Maintenance,
  filter: ReportFilter,
  completedStatuses: readonly string[],
  pendingStatuses: readonly string[],
  inProgressStatuses: readonly string[]
) => {
  return model.aggregate<TechnicianWorkloadResult>([
    { $match: { ...filter, assignedStaff: { $ne: null } } },
    {
      $group: {
        _id: "$assignedStaff",
        assignedTasks: { $sum: 1 },
        completedTasks: {
          $sum: {
            $cond: [{ $in: ["$status", completedStatuses] }, 1, 0],
          },
        },
        inProgressTasks: {
          $sum: {
            $cond: [{ $in: ["$status", inProgressStatuses] }, 1, 0],
          },
        },
        pendingTasks: {
          $sum: {
            $cond: [{ $in: ["$status", pendingStatuses] }, 1, 0],
          },
        },
      },
    },
  ]);
};

const mergeWorkload = (
  complaintWorkload: TechnicianWorkloadResult[],
  maintenanceWorkload: TechnicianWorkloadResult[]
) => {
  const workload = new Map<string, Omit<TechnicianWorkloadResult, "_id">>();

  for (const row of [...complaintWorkload, ...maintenanceWorkload]) {
    if (!row._id) continue;

    const current =
      workload.get(row._id) ??
      {
        assignedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
      };

    workload.set(row._id, {
      assignedTasks: current.assignedTasks + row.assignedTasks,
      completedTasks: current.completedTasks + row.completedTasks,
      inProgressTasks: current.inProgressTasks + row.inProgressTasks,
      pendingTasks: current.pendingTasks + row.pendingTasks,
    });
  }

  return workload;
};

export const getComplaintReport = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  await ensureCurrentUserExists(user);
  assertCanViewReports(user);

  const filter = await buildComplaintFilter(query, user);
  const skip = (query.page - 1) * query.limit;
  const statusCounts = await countByField(Complaint, filter, "status");
  const categoryCounts = await countByField(Complaint, filter, "category");
  const [total, rows] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
  ]);

  return {
    summary: {
      total,
      pending: countFromMap(statusCounts, Array.from(complaintPendingStatuses)),
      inProgress: countFromMap(statusCounts, Array.from(complaintInProgressStatuses)),
      completed: countFromMap(statusCounts, Array.from(complaintCompletedStatuses)),
      cancelled: statusCounts.CANCELLED ?? 0,
      byStatus: statusCounts,
      byCategory: complaintCategories.reduce<Record<string, number>>((acc, category) => {
        acc[category] = categoryCounts[category] ?? 0;
        return acc;
      }, {}),
    },
    complaints: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getMaintenanceReport = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  await ensureCurrentUserExists(user);
  assertCanViewReports(user);

  const filter = await buildMaintenanceFilter(query, user);
  const skip = (query.page - 1) * query.limit;
  const statusCounts = await countByField(Maintenance, filter, "status");
  const categoryCounts = await countByField(Maintenance, filter, "category");
  const [total, rows] = await Promise.all([
    Maintenance.countDocuments(filter),
    Maintenance.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
  ]);

  return {
    summary: {
      total,
      pending: countFromMap(statusCounts, Array.from(maintenancePendingStatuses)),
      inProgress: countFromMap(statusCounts, Array.from(maintenanceInProgressStatuses)),
      completed: countFromMap(statusCounts, Array.from(maintenanceCompletedStatuses)),
      cancelled: statusCounts.CANCELLED ?? 0,
      byStatus: statusCounts,
      byCategory: complaintCategories.reduce<Record<string, number>>((acc, category) => {
        acc[category] = categoryCounts[category] ?? 0;
        return acc;
      }, {}),
    },
    maintenance: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getTechnicianReport = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  await ensureCurrentUserExists(user);
  assertCanViewReports(user);

  const technicianFilter = buildTechnicianFilter(query, user);
  const complaintFilter = await buildComplaintFilter(query, user);
  const maintenanceFilter = await buildMaintenanceFilter(query, user);
  const statusCounts = await countByField(Technician, technicianFilter, "status");
  const technicians = await Technician.find(technicianFilter).sort({ fullName: 1 }).lean();
  const [complaintWorkload, maintenanceWorkload] = await Promise.all([
    getTechnicianWorkload(
      Complaint,
      complaintFilter,
      Array.from(complaintCompletedStatuses),
      Array.from(complaintPendingStatuses),
      Array.from(complaintInProgressStatuses)
    ),
    getTechnicianWorkload(
      Maintenance,
      maintenanceFilter,
      Array.from(maintenanceCompletedStatuses),
      Array.from(maintenancePendingStatuses),
      Array.from(maintenanceInProgressStatuses)
    ),
  ]);
  const workload = mergeWorkload(complaintWorkload, maintenanceWorkload);

  return {
    summary: {
      total: technicians.length,
      active: statusCounts.ACTIVE ?? 0,
      busy: statusCounts.BUSY ?? 0,
      onLeave: statusCounts.ON_LEAVE ?? 0,
      inactive: statusCounts.INACTIVE ?? 0,
      assignedTasks: Array.from(workload.values()).reduce(
        (total, item) => total + item.assignedTasks,
        0
      ),
      completedTasks: Array.from(workload.values()).reduce(
        (total, item) => total + item.completedTasks,
        0
      ),
      byStatus: technicianStatuses.reduce<Record<string, number>>((acc, status) => {
        acc[status] = statusCounts[status] ?? 0;
        return acc;
      }, {}),
    },
    technicians: technicians.map((technician) => ({
      ...technician,
      workload: workload.get(technician.userId) ?? {
        assignedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
      },
    })),
  };
};

export const getCostReport = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  await ensureCurrentUserExists(user);
  assertCanViewReports(user);

  const complaintFilter = await buildComplaintFilter(query, user);
  const maintenanceFilter = await buildMaintenanceFilter(query, user);
  const [complaintCosts, maintenanceCosts] = await Promise.all([
    getCostSummary(
      Complaint,
      complaintFilter,
      [...complaintPendingStatuses, ...complaintInProgressStatuses],
      Array.from(complaintCompletedStatuses)
    ),
    getMaintenanceCostSummary(maintenanceFilter),
  ]);

  return {
    summary: {
      totalEstimatedCost: complaintCosts.estimatedCost + maintenanceCosts.estimatedCost,
      totalFinalCost: complaintCosts.finalCost + maintenanceCosts.finalCost,
      approvedCost: complaintCosts.approvedCost + maintenanceCosts.approvedCost,
      pendingCost: complaintCosts.pendingCost + maintenanceCosts.pendingCost,
      bySource: {
        complaints: complaintCosts,
        maintenance: maintenanceCosts,
      },
    },
  };
};

export const getPendingWorkReport = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  await ensureCurrentUserExists(user);
  assertCanViewReports(user);

  const complaintFilter = await buildComplaintFilter(query, user);
  const maintenanceFilter = await buildMaintenanceFilter(query, user);
  applyPendingComplaintStatusScope(complaintFilter, query);
  applyPendingMaintenanceStatusScope(maintenanceFilter, query);

  const skip = (query.page - 1) * query.limit;
  const [
    complaintTotal,
    maintenanceTotal,
    complaintStatusCounts,
    maintenanceStatusCounts,
    unassignedComplaints,
    unassignedMaintenance,
    assignedComplaints,
    assignedMaintenance,
    complaints,
    maintenance,
  ] = await Promise.all([
    Complaint.countDocuments(complaintFilter),
    Maintenance.countDocuments(maintenanceFilter),
    countByField(Complaint, complaintFilter, "status"),
    countByField(Maintenance, maintenanceFilter, "status"),
    Complaint.countDocuments(buildUnassignedWorkFilter(complaintFilter)),
    Maintenance.countDocuments(buildUnassignedWorkFilter(maintenanceFilter)),
    Complaint.countDocuments(buildAssignedWorkFilter(complaintFilter)),
    Maintenance.countDocuments(buildAssignedWorkFilter(maintenanceFilter)),
    Complaint.find(complaintFilter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Maintenance.find(maintenanceFilter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
  ]);

  const total = complaintTotal + maintenanceTotal;
  const pages = Math.max(
    Math.ceil(complaintTotal / query.limit),
    Math.ceil(maintenanceTotal / query.limit)
  );

  return {
    summary: {
      total,
      complaints: complaintTotal,
      maintenance: maintenanceTotal,
      unassigned: unassignedComplaints + unassignedMaintenance,
      assigned: assignedComplaints + assignedMaintenance,
      inProgress:
        countFromMap(complaintStatusCounts, Array.from(complaintInProgressStatuses)) +
        countFromMap(maintenanceStatusCounts, Array.from(maintenanceInProgressStatuses)),
      awaitingReview:
        (complaintStatusCounts.WORK_COMPLETED ?? 0) +
        (complaintStatusCounts.AWAITING_APPROVAL ?? 0) +
        (maintenanceStatusCounts.WORK_COMPLETED ?? 0) +
        (maintenanceStatusCounts.AWAITING_APPROVAL ?? 0),
      byStatus: {
        complaints: complaintStatusCounts,
        maintenance: maintenanceStatusCounts,
      },
    },
    complaints,
    maintenance,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages,
    },
  };
};

export const getReportsOverview = async (
  query: ReportQuery,
  user: AuthenticatedReportUser
) => {
  const [complaints, maintenance, technicians, costs, pendingWork] = await Promise.all([
    getComplaintReport(query, user),
    getMaintenanceReport(query, user),
    getTechnicianReport(query, user),
    getCostReport(query, user),
    getPendingWorkReport(query, user),
  ]);

  return {
    filters: {
      startDate: query.startDate ?? null,
      endDate: query.endDate ?? null,
      apartment: query.apartment ?? null,
      technician: query.technician ?? null,
      category: query.category ?? null,
      complaintStatus: query.complaintStatus ?? null,
      maintenanceStatus: query.maintenanceStatus ?? null,
      technicianStatus: query.technicianStatus ?? null,
    },
    complaints,
    maintenance,
    technicians,
    costs,
    pendingWork,
  };
};
