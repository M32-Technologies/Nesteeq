"use client"

import { Eye } from "lucide-react"

import type {
  Complaint,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import {
  formatDate,
  formatId,
  formatLabel,
} from "@/features/dashboard/facility/shared/components/facility-formatters"

interface ComplaintsTableProps {
  complaints: Complaint[]
  onSelectComplaint: (id: string) => void
}

const statusBadgeStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 font-medium",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 font-medium",
  ASSIGNED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 font-medium",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 font-medium",
  WORK_COMPLETED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 font-medium",
  AWAITING_APPROVAL: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 font-medium",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 font-medium",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 font-medium",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 font-medium",
  CLOSED: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 font-medium",
  REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 font-medium",
  CANCELLED: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 font-medium",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 font-medium",
}

const priorityBadgeStyles: Record<string, string> = {
  URGENT: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 font-semibold",
  HIGH: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 font-medium",
  MEDIUM: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 font-medium",
  LOW: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 font-medium",
}

export function ComplaintsTable({
  complaints,
  onSelectComplaint,
}: ComplaintsTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-5 pr-3">Complaint ID</th>
              <th className="px-3 py-3.5">Resident</th>
              <th className="px-3 py-3.5">Category</th>
              <th className="px-3 py-3.5">Issue Details</th>
              <th className="px-3 py-3.5">Priority</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Created</th>
              <th className="px-3 py-3.5">Assigned To</th>
              <th className="py-3.5 pl-3 pr-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {complaints.map((complaint) => {
              const residentName =
                typeof complaint.residentId === "object"
                  ? complaint.residentId?.name
                  : complaint.residentId || "Resident"

              const technicianName =
                typeof complaint.assignedStaff === "object" && complaint.assignedStaff?.name
                  ? complaint.assignedStaff.name
                  : complaint.assignedTechnicianName ||
                    (typeof complaint.assignedTo === "object" && complaint.assignedTo?.name
                      ? complaint.assignedTo.name
                      : null)

              const statusStyle =
                statusBadgeStyles[complaint.status] ||
                "bg-slate-100 text-slate-700 ring-1 ring-slate-200"

              const priorityStyle =
                priorityBadgeStyles[complaint.priority] ||
                "bg-slate-100 text-slate-700 ring-1 ring-slate-200"

              return (
                <tr
                  key={complaint._id}
                  onClick={() => onSelectComplaint(complaint._id)}
                  className="group cursor-pointer transition hover:bg-slate-50/80"
                >
                  {/* ID */}
                  <td className="py-3.5 pl-5 pr-3 font-mono text-xs font-semibold text-slate-900 group-hover:text-[#0F5F45] transition-colors">
                    {formatId(complaint._id)}
                  </td>

                  {/* Resident */}
                  <td className="px-3 py-3.5 font-medium text-slate-800">
                    <p className="truncate max-w-[140px]">{residentName}</p>
                    {complaint.flatId ? (
                      <p className="text-[11px] text-slate-400">Unit {complaint.flatId}</p>
                    ) : null}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {formatLabel(complaint.category)}
                    </span>
                  </td>

                  {/* Title & Description */}
                  <td className="max-w-[280px] px-3 py-3.5">
                    <p className="truncate font-semibold text-slate-900">
                      {complaint.title}
                    </p>
                    {complaint.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {complaint.description}
                      </p>
                    ) : null}
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] ${priorityStyle}`}
                    >
                      {formatLabel(complaint.priority)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] ${statusStyle}`}
                    >
                      {formatLabel(complaint.status)}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-3 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(complaint.createdAt)}
                  </td>

                  {/* Assigned Staff */}
                  <td className="px-3 py-3.5 text-xs">
                    {technicianName ? (
                      <span className="font-medium text-slate-800 truncate block max-w-[130px]">
                        {technicianName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 pl-3 pr-5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectComplaint(complaint._id)
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-[#0F5F45] hover:bg-[#0F5F45]/5 hover:text-[#0F5F45]"
                      aria-label="View complaint details"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-slate-100 lg:hidden">
        {complaints.map((complaint) => {
          const residentName =
            typeof complaint.residentId === "object"
              ? complaint.residentId?.name
              : complaint.residentId || "Resident"

          const technicianName =
            typeof complaint.assignedStaff === "object" && complaint.assignedStaff?.name
              ? complaint.assignedStaff.name
              : complaint.assignedTechnicianName ||
                (typeof complaint.assignedTo === "object" && complaint.assignedTo?.name
                  ? complaint.assignedTo.name
                  : null)

          const statusStyle =
            statusBadgeStyles[complaint.status] ||
            "bg-slate-100 text-slate-700 ring-1 ring-slate-200"

          const priorityStyle =
            priorityBadgeStyles[complaint.priority] ||
            "bg-slate-100 text-slate-700 ring-1 ring-slate-200"

          return (
            <article
              key={complaint._id}
              onClick={() => onSelectComplaint(complaint._id)}
              className="cursor-pointer p-4 transition hover:bg-slate-50/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0F5F45]">
                      {formatId(complaint._id)}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {formatLabel(complaint.category)}
                    </span>
                  </div>
                  <h2 className="mt-1.5 line-clamp-1 text-sm font-semibold text-slate-900">
                    {complaint.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectComplaint(complaint._id)
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs"
                  aria-label="View complaint details"
                >
                  <Eye size={15} />
                </button>
              </div>

              {complaint.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {complaint.description}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] ${statusStyle}`}
                >
                  {formatLabel(complaint.status)}
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] ${priorityStyle}`}
                >
                  {formatLabel(complaint.priority)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>By: {residentName}</span>
                <span>{formatDate(complaint.createdAt)}</span>
              </div>

              {technicianName ? (
                <div className="mt-1 text-[11px] text-slate-600">
                  Technician: <strong className="font-semibold text-slate-800">{technicianName}</strong>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {/* Table Footer Summary */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing <strong className="text-slate-700">{complaints.length}</strong> complaint{complaints.length === 1 ? "" : "s"}
        </span>
      </div>
    </>
  )
}

export default ComplaintsTable