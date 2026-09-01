import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { FacilityActivityItem } from "../../facility.types"
import {
  EmptyState,
  formatDate,
  formatId,
  formatLabel,
} from "../facility-ui"

const activityLabels: Record<FacilityActivityItem["type"], string> = {
  NEW_COMPLAINT: "New complaint",
  TECHNICIAN_UPDATE: "Technician update",
  WORK_COMPLETED: "Completed work",
  COST_SUBMITTED: "Cost submission",
  RESIDENT_CONFIRMATION: "Resident confirmation",
}

function ActivityRow({ item }: { item: FacilityActivityItem }) {
  return (
    <Link
      href={
        item.resourceType === "maintenance"
          ? "/facility-manager/maintenance"
          : "/facility-manager/complaints"
      }
      className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#07584F]">
            {activityLabels[item.type]}
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">
            {item.description}
          </p>
          <p className="mt-1 text-[12px] text-[#66737F]">
            {formatLabel(item.resourceType)} {formatId(item.resourceId)}
          </p>
        </div>
        <div className="shrink-0 text-right text-[12px] text-[#66737F]">
          {formatDate(item.occurredAt)}
        </div>
      </div>
    </Link>
  )
}

export function RecentActivityPanel({
  items,
}: {
  items: FacilityActivityItem[]
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111111]">
            Recent Activity
          </h2>
          <p className="mt-1 text-[12px] text-[#66737F]">
            Complaints, technician updates, completed work, costs, and confirmations
          </p>
        </div>
        <ArrowRight className="size-4 text-[#8793A0]" />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No recent activity"
          message="Operational activity will appear here as work moves through the system."
        />
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
