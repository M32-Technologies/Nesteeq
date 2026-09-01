import Link from "next/link"

import {
  priorities,
  type FacilityDashboardWorkItem,
  type Priority,
} from "../../facility.types"
import {
  formatCurrency,
  formatId,
  PriorityBadge,
  StatusBadge,
} from "../facility-ui"

function isPriority(value?: string | null): value is Priority {
  return (priorities as readonly string[]).includes(value ?? "")
}

function getItemHref(
  item: FacilityDashboardWorkItem,
  fallback: "complaint" | "maintenance"
) {
  const type = item.type ?? fallback
  return type === "maintenance"
    ? "/facility-manager/maintenance"
    : "/facility-manager/complaints"
}

export function PendingActionList({
  title,
  fallbackType,
  count,
  items,
}: {
  title: string
  fallbackType: "complaint" | "maintenance"
  count: number
  items: FacilityDashboardWorkItem[]
}) {
  return (
    <section className="rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] px-4 py-4">
        <h2 className="text-[15px] font-semibold text-[#111111]">{title}</h2>
        <span className="rounded-md bg-[#EEF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#2E639B]">
          {count}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-5 text-[13px] text-[#66737F]">No pending items.</div>
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {items.map((item) => (
            <Link
              key={`${title}-${item.id}`}
              href={getItemHref(item, fallbackType)}
              className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#07584F]">
                    {formatId(item.id)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">
                    {item.title}
                  </p>
                  {item.submittedAmount !== undefined ? (
                    <p className="mt-1 text-[12px] text-[#66737F]">
                      {formatCurrency(item.submittedAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  {isPriority(item.priority) ? (
                    <PriorityBadge priority={item.priority} />
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
