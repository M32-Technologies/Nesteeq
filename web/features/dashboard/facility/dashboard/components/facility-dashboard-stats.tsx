import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Hammer,
  Timer,
  UserRoundCog,
  WalletCards,
} from "lucide-react"

import type {
  FacilityComplaintStats,
  FacilityMaintenanceStats,
  FacilityScheduleStats,
  FacilityTechnicianStats,
} from "@/features/dashboard/facility/dashboard/types/dashboard.types"
import { MetricCard } from "@/features/dashboard/facility/shared/components/facility-ui"

export function FacilityDashboardStats({
  stats,
}: {
  stats?: {
    complaints?: Partial<FacilityComplaintStats>
    maintenance?: Partial<FacilityMaintenanceStats>
    technicians?: Partial<FacilityTechnicianStats> | number
    schedules?: Partial<FacilityScheduleStats>
    openComplaints?: number
    pendingMaintenanceRequests?: number
    assignedTasks?: number
    inProgressTasks?: number
    completedTasks?: number
    overdueTasks?: number
    pendingApprovals?: number
  }
}) {
  if (!stats) return null

  const openComplaintsValue =
    typeof stats.complaints?.pending === "number" || typeof stats.complaints?.assigned === "number"
      ? (stats.complaints?.pending ?? 0) + (stats.complaints?.assigned ?? 0)
      : stats.openComplaints ?? 0

  const pendingMaintenanceValue =
    stats.maintenance?.pending ?? stats.pendingMaintenanceRequests ?? 0

  const assignedTasksValue =
    stats.maintenance?.assigned ?? stats.assignedTasks ?? 0

  const inProgressTasksValue =
    stats.maintenance?.inProgress ?? stats.inProgressTasks ?? 0

  const resolvedComplaintsValue =
    stats.complaints?.resolved ?? stats.completedTasks ?? 0

  const activeTechniciansValue =
    stats.technicians && typeof stats.technicians === "object"
      ? stats.technicians.active ?? 0
      : typeof stats.technicians === "number"
      ? stats.technicians
      : 0

  const scheduledItemsValue =
    stats.schedules?.scheduled ?? stats.overdueTasks ?? 0

  const totalTechniciansValue =
    stats.technicians && typeof stats.technicians === "object"
      ? stats.technicians.total ?? 0
      : typeof stats.technicians === "number"
      ? stats.technicians
      : 0

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Open Complaints"
        value={openComplaintsValue}
        icon={ClipboardList}
        tone="green"
      />
      <MetricCard
        title="Pending Maintenance"
        value={pendingMaintenanceValue}
        icon={Timer}
        tone="amber"
      />
      <MetricCard
        title="Assigned Tasks"
        value={assignedTasksValue}
        icon={UserRoundCog}
        tone="blue"
      />
      <MetricCard
        title="In-Progress Tasks"
        value={inProgressTasksValue}
        icon={Gauge}
        tone="green"
      />
      <MetricCard
        title="Resolved Complaints"
        value={resolvedComplaintsValue}
        icon={CheckCircle2}
        tone="gray"
      />
      <MetricCard
        title="Active Technicians"
        value={activeTechniciansValue}
        icon={Hammer}
        tone="blue"
      />
      <MetricCard
        title="Scheduled Items"
        value={scheduledItemsValue}
        icon={WalletCards}
        tone="amber"
      />
      <MetricCard
        title="Total Technicians"
        value={totalTechniciansValue}
        icon={AlertTriangle}
        tone="rose"
      />
    </div>
  )
}
