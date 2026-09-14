import api from "@/lib/axios"
import type { ApiResponse } from "../../shared/types/common.types"
import type { FacilityDashboardData } from "../types/dashboard.types"

const FACILITY_DASHBOARD_PATH = "/api/v1/facility/dashboard"

export async function fetchFacilityDashboard(): Promise<FacilityDashboardData> {
  const response = await api.get<ApiResponse<any>>(FACILITY_DASHBOARD_PATH)

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Failed to load facility dashboard"
    )
  }

  const raw = response.data.data || {}
  const rawStats = raw.stats || {}

  return {
    stats: {
      complaints: rawStats.complaints ?? {
        total: (rawStats.openComplaints ?? 0) + (rawStats.completedTasks ?? 0),
        pending: rawStats.openComplaints ?? 0,
        assigned: rawStats.assignedTasks ?? 0,
        inProgress: rawStats.inProgressTasks ?? 0,
        resolved: rawStats.completedTasks ?? 0,
        awaitingApproval: rawStats.pendingApprovals ?? 0,
      },
      maintenance: rawStats.maintenance ?? {
        total: (rawStats.pendingMaintenanceRequests ?? 0) + (rawStats.assignedTasks ?? 0),
        pending: rawStats.pendingMaintenanceRequests ?? 0,
        assigned: rawStats.assignedTasks ?? 0,
        inProgress: rawStats.inProgressTasks ?? 0,
        resolved: rawStats.completedTasks ?? 0,
        awaitingApproval: rawStats.pendingApprovals ?? 0,
      },
      technicians:
        rawStats.technicians && typeof rawStats.technicians === "object"
          ? rawStats.technicians
          : {
              total: typeof rawStats.technicians === "number" ? rawStats.technicians : 0,
              active: typeof rawStats.technicians === "number" ? rawStats.technicians : 0,
              busy: 0,
              onLeave: 0,
            },
      schedules: rawStats.schedules ?? {
        total: rawStats.overdueTasks ?? 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      },
    },
    pendingActions: {
      complaintsToAssign:
        raw.pendingActions?.complaintsToAssign ??
        raw.pendingActions?.unassignedComplaints?.items ??
        [],
      complaintsToApprove: raw.pendingActions?.complaintsToApprove ?? [],
      maintenanceToApprove:
        raw.pendingActions?.maintenanceToApprove ??
        raw.pendingActions?.workRequiringReview?.items ??
        [],
      maintenanceCostToReview:
        raw.pendingActions?.maintenanceCostToReview ??
        raw.pendingActions?.submittedCostsRequiringApproval?.items ??
        [],
    },
    overdueSchedules: raw.overdueSchedules ?? raw.overdue?.schedules ?? [],
    recentActivities: raw.recentActivities ?? raw.recentActivity ?? [],
  }
}
