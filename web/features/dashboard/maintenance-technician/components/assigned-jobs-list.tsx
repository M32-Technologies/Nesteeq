"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"

import { getAssignedJobs } from "../services/jobs.service"
import MaintenanceJobFilters from "./maintenance-job-filters"
import MaintenanceJobsTable from "./maintenance-jobs-table"

export const jobsQueryKeys = {
  all: ["maintenance-technician", "jobs"] as const,
  list: (status?: string) => [...jobsQueryKeys.all, "list", status ?? "ACTIVE"] as const,
}

export default function AssignedJobsList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: jobsQueryKeys.list(statusFilter),
    queryFn: () => getAssignedJobs(statusFilter),
    staleTime: 60 * 1000,
  })

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" ||
        job.jobId.toLowerCase().includes(search.toLowerCase()) ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.category.toLowerCase().includes(search.toLowerCase()) ||
        job.flat.toLowerCase().includes(search.toLowerCase()) ||
        job.block.toLowerCase().includes(search.toLowerCase())

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
  }, [jobs, search, statusFilter, priorityFilter])

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
        />

        <MaintenanceJobsTable
          jobs={filteredJobs}
          totalCount={jobs.length}
          isLoading={isLoading}
          hasFilters={Boolean(search || statusFilter !== "ACTIVE" || priorityFilter !== "ALL")}
        />
      </div>
    </div>
  )
}