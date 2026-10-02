"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  Calendar,
  Clock,
  Eye,
  Layers,
  MapPin,
  MoreVertical,
  Wrench,
} from "lucide-react"

import type { AssignedJob } from "../services/jobs.service"

type MaintenanceJobsTableProps = {
  jobs: AssignedJob[]
  totalCount: number
  isLoading: boolean
  hasFilters: boolean
}

const priorityStyles: Record<AssignedJob["priority"], string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
}

const statusStyles: Record<AssignedJob["status"], { badge: string; label: string }> = {
  ASSIGNED: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Assigned",
  },
  IN_PROGRESS: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    label: "In Progress",
  },
  COMPLETED: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Completed",
  },
}

export default function MaintenanceJobsTable({
  jobs,
  totalCount,
  isLoading,
  hasFilters,
}: MaintenanceJobsTableProps) {
  const [openActionJobId, setOpenActionJobId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(dateString))
    } catch {
      return dateString
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[28%]" />
            <col className="w-[13%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Job ID
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Issue / Title
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Location
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Priority
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assigned Date
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-4 w-16 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-48 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-14 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="ml-auto h-7 w-14 rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Wrench size={22} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    No assigned jobs found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {hasFilters
                      ? "Try clearing filters to see more results."
                      : "You currently have no maintenance work assigned."}
                  </p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const statusInfo = statusStyles[job.status] || {
                  badge: "bg-slate-100 text-slate-700 border-slate-200",
                  label: job.status,
                }

                return (
                  <tr
                    key={job.jobId}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Job ID */}
                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0F5F45]">
                        {job.jobId}
                      </span>
                    </td>

                    {/* Issue / Title */}
                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-sm font-medium text-slate-900" title={job.title}>
                        {job.title}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Layers size={14} className="shrink-0 text-slate-400" />
                        <span>{job.category}</span>
                      </div>
                    </td>

                    {/* Location (Block + Flat) */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <MapPin size={14} className="shrink-0 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {job.flat}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({job.block})
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          priorityStyles[job.priority] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.priority}
                      </span>
                    </td>

                    {/* Assigned Date */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Calendar size={13} className="shrink-0 text-slate-400" />
                        <span>{formatDate(job.assignedDate)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badge}`}
                      >
                        {job.status === "IN_PROGRESS" ? (
                          <Activity size={12} className="animate-pulse" />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{statusInfo.label}</span>
                      </span>
                    </td>

                    {/* Action 3-Dot Dropdown Menu */}
                    <td className="px-5 py-4 text-right align-middle">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionJobId((current) =>
                              current === job.jobId ? null : job.jobId
                            )
                          }
                          aria-expanded={openActionJobId === job.jobId}
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionJobId === job.jobId && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenActionJobId(null)}
                            />
                            <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                              <Link
                                href={`/maintenance-technician/jobs/${job.jobId}`}
                                onClick={() => setOpenActionJobId(null)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                              >
                                <Eye size={15} className="text-slate-500" />
                                View Details
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="border-t border-slate-200 px-5 py-3.5 sm:px-6">
        <p className="text-xs font-medium text-slate-500">
          Showing {jobs.length} of {totalCount} assigned job{totalCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  )
}