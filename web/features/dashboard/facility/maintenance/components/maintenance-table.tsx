import { Eye } from "lucide-react"

import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import {
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function MaintenanceTable({
  maintenance,
  onSelectMaintenance,
}: {
  maintenance: Maintenance[]
  onSelectMaintenance: (id: string) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1240px] text-left">
          <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-4 py-3">Maintenance ID</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {maintenance.map((item) => (
              <tr
                key={item._id}
                className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
              >
                <td className="px-4 py-4 font-semibold text-[#111111]">
                  {formatId(item._id)}
                </td>
                <td className="px-4 py-4">{formatLabel(item.category)}</td>
                <td className="max-w-[260px] px-4 py-4">
                  <div className="truncate font-medium text-[#111111]">
                    {item.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                    {item.description}
                  </div>
                </td>
                <td className="px-4 py-4">{formatId(typeof item.assignedTo === 'object' ? item.assignedTo?._id : item.assignedTo)}</td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  <div>Estimate: {formatCurrency(item.estimatedCost)}</div>
                  <div className="mt-1">Actual: {formatCurrency(item.finalCost)}</div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  <div>{formatDate(item.createdAt)}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectMaintenance(item._id)}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                      aria-label="View maintenance"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#EEF2F5] lg:hidden">
        {maintenance.map((item) => (
          <article key={item._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  {formatId(item._id)}
                </p>
                <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                  {item.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectMaintenance(item._id)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                aria-label="View maintenance"
              >
                <Eye className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
            </div>
            <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
              <span>{formatLabel(item.category)}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
