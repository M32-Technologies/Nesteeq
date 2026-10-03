"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"

import { useSession } from "@/lib/auth-client"
import { getAssignedJobs } from "../services/jobs.service"
import MaintenanceJobFilters from "./maintenance-job-filters"
import MaintenanceJobsTable from "./maintenance-jobs-table"

export const jobsQueryKeys = {
  all: ["maintenance-technician", "jobs"] as const,
  list: (status?: string, order?: string, userId?: string) =>
    [...jobsQueryKeys.all, "list", status ?? "ACTIVE", order ?? "desc", userId ?? "me"] as const,
}

export default function AssignedJobsList() {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")
  const [order, setOrder] = useState<"desc" | "asc">("desc")

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: jobsQueryKeys.list(statusFilter, order, session?.user?.id),
    queryFn: () => getAssignedJobs(statusFilter, order),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  })

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

    return [...list].sort((a, b) => {
      const dateA = new Date(a.assignedDate || a.createdAt || 0).getTime()
      const dateB = new Date(b.assignedDate || b.createdAt || 0).getTime()
      return order === "asc" ? dateA - dateB : dateB - dateA
    })
  }, [jobs, search, statusFilter, priorityFilter, order])

  return (
    <div className="space-y-4">
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            {error instanceof Error ? error.message : "Failed to load assigned jobs"}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <MaintenanceJobFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          order={order}
          onOrderChange={setOrder}
        />

        <MaintenanceJobsTable
          jobs={filteredJobs}
          totalCount={jobs.length}
          isLoading={isLoading}
          hasFilters={Boolean(search || statusFilter !== "ACTIVE" || priorityFilter !== "ALL" || order !== "desc")}
        />
      </div>
    </div>
  )
}