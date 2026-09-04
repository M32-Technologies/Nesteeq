import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  EmptyState,
  formatDate,
  formatLabel,
} from "@/features/dashboard/facility/shared/components/facility-ui"

type ActivityItem = {
  id: string
  type: "complaint" | "maintenance" | "schedule"
  title: string
  status: string
  updatedAt: string
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const href =
    item.type === "maintenance"
      ? "/facility-manager/maintenance"
      : item.type === "schedule"
      ? "/facility-manager/schedule"
      : "/facility-manager/complaints"

  return (
    <Link
      href={href}
      className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#07584F]">
            {formatLabel(item.type)}
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">
            {item.title}
          </p>
          <p className="mt-1 text-[12px] text-[#66737F]">
            Status: {formatLabel(item.status)}
          </p>
        </div>
        <div className="shrink-0 text-right text-[12px] text-[#66737F]">
          {formatDate(item.updatedAt)}
        </div>
      </div>
    </Link>
  )
}

export function RecentActivityPanel({
  activities = [],
}: {
  activities?: ActivityItem[]
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111111]">
            Recent Activity
          </h2>
          <p className="mt-1 text-[12px] text-[#66737F]">
            Operational activity and progress updates
          </p>
        </div>
        <ArrowRight className="size-4 text-[#8793A0]" />
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="No recent activity"
          message="Operational activity will appear here as work moves through the system."
        />
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {activities.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
