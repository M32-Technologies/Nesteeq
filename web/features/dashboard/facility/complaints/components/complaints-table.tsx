import { Eye } from "lucide-react"

import type { Complaint } from "@/features/dashboard/facility/complaints/types/complaints.types"
import {
  formatDate,
  formatId,
  formatLabel,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function ComplaintsTable({
  complaints,
  onSelectComplaint,
}: {
  complaints: Complaint[]
  onSelectComplaint: (id: string) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1120px] text-left">
          <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-4 py-3">Complaint ID</th>
              <th className="px-4 py-3">Resident</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {complaints.map((complaint) => (
              <tr
                key={complaint._id}
                className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
              >
                <td className="px-4 py-4 font-semibold text-[#111111]">
                  {formatId(complaint._id)}
                </td>
                <td className="px-4 py-4">{formatId(typeof complaint.residentId === "object" ? complaint.residentId?.name : complaint.residentId)}</td>
                <td className="px-4 py-4">{formatLabel(complaint.category)}</td>
                <td className="max-w-[260px] px-4 py-4">
                  <div className="truncate font-medium text-[#111111]">
                    {complaint.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                    {complaint.description}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={complaint.priority} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={complaint.status} />
                </td>
                <td className="px-4 py-4 text-[12px] text-[#66737F]">
                  {formatDate(complaint.createdAt)}
                </td>
                <td className="px-4 py-4">
                  {formatId(typeof complaint.assignedTo === "object" ? complaint.assignedTo?.name : complaint.assignedTo)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectComplaint(complaint._id)}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                      aria-label="View complaint"
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
        {complaints.map((complaint) => (
          <article key={complaint._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  {formatId(complaint._id)}
                </p>
                <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                  {complaint.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectComplaint(complaint._id)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                aria-label="View complaint"
              >
                <Eye className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
              <span>{formatLabel(complaint.category)}</span>
              <span>{formatDate(complaint.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
