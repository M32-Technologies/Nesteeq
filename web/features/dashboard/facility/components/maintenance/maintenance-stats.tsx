import {
  CheckCircle2,
  Gauge,
  Timer,
  UserRoundCog,
  Wrench,
} from "lucide-react"

import type { FacilityMaintenanceStats } from "../../facility.types"
import { MetricCard } from "../facility-ui"

export function MaintenanceStats({
  stats,
}: {
  stats?: FacilityMaintenanceStats
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        title="Total maintenance"
        value={stats?.total}
        icon={Wrench}
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
        title="Completed"
        value={stats?.completed}
        icon={CheckCircle2}
        tone="gray"
      />
    </div>
  )
}
