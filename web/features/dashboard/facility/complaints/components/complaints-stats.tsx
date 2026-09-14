import {
  CheckCircle2,
  ClipboardList,
  Gauge,
  Timer,
  UserRoundCog,
} from "lucide-react"

import type { FacilityComplaintStats } from "@/features/dashboard/facility/complaints/types/complaints.types"
import { MetricCard } from "@/features/dashboard/facility/shared/components/facility-ui"

export function ComplaintsStats({
  stats,
}: {
  stats?: FacilityComplaintStats
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        title="Total complaints"
        value={stats?.total}
        icon={ClipboardList}
        tone="green"
      />
      <MetricCard
        title="Pending"
        value={stats?.pending}
        icon={Timer}
        tone="amber"
      />
      <MetricCard
        title="Assigned"
        value={stats?.assigned}
        icon={UserRoundCog}
        tone="blue"
      />
      <MetricCard
        title="In progress"
        value={stats?.inProgress}
        icon={Gauge}
        tone="green"
      />
      <MetricCard
        title="Resolved"
        value={stats?.resolved}
        icon={CheckCircle2}
        tone="gray"
      />
    </div>
  )
}
