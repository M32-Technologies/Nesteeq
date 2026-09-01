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

import type { FacilityDashboardStatData } from "../../facility.types"
import { MetricCard } from "../facility-ui"

export function FacilityDashboardStats({
  stats,
}: {
  stats: FacilityDashboardStatData
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Open Complaints"
        value={stats.openComplaints}
        icon={ClipboardList}
        tone="green"
      />
      <MetricCard
        title="Pending Maintenance Requests"
        value={stats.pendingMaintenanceRequests}
        icon={Timer}
        tone="amber"
      />
      <MetricCard
        title="Assigned Tasks"
        value={stats.assignedTasks}
        icon={UserRoundCog}
        tone="blue"
      />
      <MetricCard
        title="In-Progress Tasks"
        value={stats.inProgressTasks}
        icon={Gauge}
        tone="green"
      />
      <MetricCard
        title="Completed Tasks"
        value={stats.completedTasks}
        icon={CheckCircle2}
        tone="gray"
      />
      <MetricCard
        title="Overdue Tasks"
        value={stats.overdueTasks}
        icon={AlertTriangle}
        tone="rose"
      />
      <MetricCard
        title="Pending Approvals"
        value={stats.pendingApprovals}
        icon={WalletCards}
        tone="amber"
      />
      <MetricCard
        title="Technicians"
        value={stats.technicians}
        icon={Hammer}
        tone="blue"
      />
    </div>
  )
}
