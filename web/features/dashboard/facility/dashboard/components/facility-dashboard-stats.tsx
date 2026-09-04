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
    complaints: FacilityComplaintStats
    maintenance: FacilityMaintenanceStats
    technicians: FacilityTechnicianStats
    schedules: FacilityScheduleStats
  }
}) {
  if (!stats) return null

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Open Complaints"
        value={stats.complaints.pending + stats.complaints.assigned}
        icon={ClipboardList}
        tone="green"
      />
      <MetricCard
        title="Pending Maintenance"
        value={stats.maintenance.pending}
        icon={Timer}
        tone="amber"
      />
      <MetricCard
        title="Assigned Tasks"
        value={stats.maintenance.assigned}
        icon={UserRoundCog}
        tone="blue"
      />
      <MetricCard
        title="In-Progress Tasks"
        value={stats.maintenance.inProgress}
        icon={Gauge}
        tone="green"
      />
      <MetricCard
        title="Resolved Complaints"
        value={stats.complaints.resolved}
        icon={CheckCircle2}
        tone="gray"
      />
      <MetricCard
        title="Active Technicians"
        value={stats.technicians.active}
        icon={Hammer}
        tone="blue"
      />
      <MetricCard
        title="Scheduled Items"
        value={stats.schedules.scheduled}
        icon={WalletCards}
        tone="amber"
      />
      <MetricCard
        title="Total Technicians"
        value={stats.technicians.total}
        icon={AlertTriangle}
        tone="rose"
      />
    </div>
  )
}
