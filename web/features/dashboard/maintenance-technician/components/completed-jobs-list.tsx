"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Eye,
  Inbox,
  MapPin,
  MoreVertical,
  Search,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type AssignedJob, getAssignedJobs } from "../services/jobs.service"
import { formatJobLocation } from "./maintenance-jobs-table"

export const completedJobsQueryKeys = {
  all: ["maintenance-technician", "jobs", "completed"] as const,
}

const priorityStyles: Record<AssignedJob["priority"], string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
}

export default function CompletedJobsList() {
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [openActionJobId, setOpenActionJobId] = useState<string | null>(null)

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: completedJobsQueryKeys.all,
    queryFn: () => getAssignedJobs("COMPLETED"),
    staleTime: 60 * 1000,
  })

  // Ensure only COMPLETED jobs are shown
  const completedJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "COMPLETED")
  }, [jobs])

  // Extract distinct categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>()
    completedJobs.forEach((j) => set.add(j.category))
    return Array.from(set)
  }, [completedJobs])

  const filteredJobs = useMemo(() => {
    return completedJobs.filter((job) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        q === "" ||
        job.jobId.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        Boolean(job.flat && job.flat.toLowerCase().includes(q)) ||
        Boolean(job.block && job.block.toLowerCase().includes(q)) ||
        Boolean(job.flatNumber && job.flatNumber.toLowerCase().includes(q)) ||
        Boolean(job.location && job.location.toLowerCase().includes(q))

      const matchesPriority =
        priorityFilter === "ALL" || job.priority === priorityFilter

      const matchesCategory =
        categoryFilter === "ALL" || job.category === categoryFilter

      return matchesSearch && matchesPriority && matchesCategory
    })
  }, [completedJobs, search, priorityFilter, categoryFilter])

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

  const hasFilters = Boolean(
    search.trim() || priorityFilter !== "ALL" || categoryFilter !== "ALL"
  )

  const handleResetFilters = () => {
    setSearch("")
    setPriorityFilter("ALL")
    setCategoryFilter("ALL")
  }

  return (
    <div className="space-y-4">
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load completed jobs"}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filters Header */}
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search completed jobs by ID, issue, flat, or block..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>

            {/* Category Filter */}
            <div className="relative w-full sm:w-[170px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative w-full sm:w-[160px]">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="ALL">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Completed Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-16" />
              <col className="w-[30%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="w-16 px-3 py-3.5 text-center">SL NO</th>
                <th className="px-4 py-3.5 text-left">Issue Details</th>
                <th className="px-4 py-3.5 text-left">Location</th>
                <th className="px-4 py-3.5 text-left">Priority</th>
                <th className="px-4 py-3.5 text-left">Assigned Date</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="w-16 px-3 py-4 text-center">
                      <div className="mx-auto h-4 w-6 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-48 rounded bg-slate-100" />
                        <div className="h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-16 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-20 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="ml-auto h-8 w-8 rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0F5F45]">
                        <Inbox size={24} />
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-slate-800">
                        {hasFilters
                          ? "No completed jobs found"
                          : "No completed jobs yet"}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {hasFilters
                          ? "Try adjusting or clearing your search and filter criteria."
                          : "Jobs you finalize and mark as completed will be recorded here."}
                      </p>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, index) => {
                  const serialNumber = index + 1
                  const loc = formatJobLocation(job)

                  return (
                    <tr
                      key={job.jobId}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* SL NO */}
                      <td className="w-16 px-3 py-4 text-center align-middle">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {serialNumber}
                        </span>
                      </td>

                      {/* Issue Title & Category */}
                      <td className="px-4 py-4 align-middle">
                        <div className="space-y-1">
                          <Link
                            href={`/maintenance-technician/jobs/${job.jobId}`}
                            className="font-medium text-slate-900 transition hover:text-[#0F5F45] hover:underline"
                          >
                            {job.title}
                          </Link>
                          <div>
                            <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {job.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <MapPin size={14} className="shrink-0 text-slate-400" />
                          <span className="font-semibold text-slate-900">
                            {loc.main}
                          </span>
                          {loc.sub ? (
                            <span className="text-xs text-slate-400">
                              {loc.sub}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            priorityStyles[job.priority] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {job.priority}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Calendar
                            size={13}
                            className="shrink-0 text-slate-400"
                          />
                          <span>{formatDate(job.assignedDate)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          <span>Completed</span>
                        </span>
                      </td>

                      {/* Action 3-Dot Dropdown Menu (Read-only View Details) */}
                      <td className="px-5 py-4 text-right align-middle">
                        <div className="inline-block text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none"
                              title="Actions"
                              aria-label="Actions"
                            >
                              <MoreVertical size={18} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                              <DropdownMenuLinkItem
                                render={
                                  <Link href={`/maintenance-technician/jobs/${job.jobId}`} />
                                }
                              >
                                <Eye size={15} className="text-slate-500" />
                                View Details
                              </DropdownMenuLinkItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3.5 sm:px-6">
          <p className="text-xs font-medium text-slate-500">
            Showing {filteredJobs.length} of {completedJobs.length} completed job
            {completedJobs.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  )
}

