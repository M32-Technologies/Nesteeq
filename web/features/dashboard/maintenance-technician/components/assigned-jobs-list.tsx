"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, ArrowRight } from "lucide-react"

import { useSession } from "@/lib/auth-client"
import { getAssignedJobs } from "../services/jobs.service"
import MaintenanceJobFilters from "./maintenance-job-filters"
import MaintenanceJobsTable from "./maintenance-jobs-table"

export const jobsQueryKeys = {
  all: ["maintenance-technician", "jobs"] as const,
  list: (status?: string, order?: string, page?: number, limit?: number, userId?: string) =>
    [
      ...jobsQueryKeys.all,
      "list",
      status ?? "ACTIVE",
      order ?? "desc",
      page ?? 1,
      limit ?? 10,
      userId ?? "me",
    ] as const,
}

type AssignedJobsListProps = {
  isOverview?: boolean
  limit?: number
}

export default function AssignedJobsList({
  isOverview = false,
  limit: customLimit,
}: AssignedJobsListProps) {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")
  const [order, setOrder] = useState<"desc" | "asc">("desc")
  const [page, setPage] = useState(1)

  const pageSize = isOverview ? (customLimit ?? 5) : (customLimit ?? 10)

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: jobsQueryKeys.list(statusFilter, order, page, pageSize, session?.user?.id),
    queryFn: () => getAssignedJobs(statusFilter, order, "createdAt", page, pageSize),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  })

  const jobs = data?.jobs ?? []
  const pagination = data?.pagination ?? {
    total: jobs.length,
    page,
    limit: pageSize,
    totalPages: Math.ceil(jobs.length / pageSize) || 1,
  }

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handlePriorityChange = (val: string) => {
    setPriorityFilter(val)
    setPage(1)
  }

  const handleOrderChange = (val: "desc" | "asc") => {
    setOrder(val)
    setPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const filteredJobs = useMemo(() => {
    const list = jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" ||
        job.jobId.toLowerCase().includes(search.toLowerCase()) ||
        (job._id && job._id.toLowerCase().includes(search.toLowerCase())) ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        (job.issueDetails && job.issueDetails.toLowerCase().includes(search.toLowerCase())) ||
        job.category.toLowerCase().includes(search.toLowerCase()) ||
        job.flat.toLowerCase().includes(search.toLowerCase()) ||
        job.block.toLowerCase().includes(search.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? job.status !== "COMPLETED"
          : job.status === statusFilter

      const matchesPriority =
        priorityFilter === "ALL" || job.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })

    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.assignedDate || a.createdAt || 0).getTime()
      const dateB = new Date(b.assignedDate || b.createdAt || 0).getTime()
      return order === "asc" ? dateA - dateB : dateB - dateA
    })

    return isOverview ? sorted.slice(0, pageSize) : sorted
  }, [jobs, search, statusFilter, priorityFilter, order, isOverview, pageSize])

  return (
    <div className="space-y-4">
      {isOverview && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Assigned Jobs</h2>
            <p className="text-xs text-slate-500">Showing the latest assigned tasks</p>
          </div>
          <Link
            href="/maintenance-technician/jobs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            {error instanceof Error ? error.message : "Failed to load assigned jobs"}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {!isOverview && (
          <MaintenanceJobFilters
            search={search}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            priorityFilter={priorityFilter}
            onPriorityChange={handlePriorityChange}
            order={order}
            onOrderChange={handleOrderChange}
          />
        )}

        <MaintenanceJobsTable
          jobs={filteredJobs}
          totalCount={pagination.total}
          totalPages={pagination.totalPages}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          showPagination={!isOverview}
          isLoading={isLoading}
          hasFilters={Boolean(
            search ||
            statusFilter !== "ACTIVE" ||
            priorityFilter !== "ALL" ||
            order !== "desc"
          )}
        />
      </div>
    </div>
  )
}