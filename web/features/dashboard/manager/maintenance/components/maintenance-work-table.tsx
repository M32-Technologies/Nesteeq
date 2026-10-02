"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Search,
  UserRoundCog,
  Wrench,
} from "lucide-react"

import type {
  MaintenanceTrade,
  MaintenanceWorkOrder,
  WorkPriority,
  WorkProgressStage,
} from "../types/maintenance"

interface MaintenanceWorkTableProps {
  workOrders?: MaintenanceWorkOrder[]
  isLoading?: boolean
  onViewWorkOrder: (order: MaintenanceWorkOrder) => void
}

const stageBadgeStyles: Record<WorkProgressStage, string> = {
  ASSIGNED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  INSPECTION: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
}

const stageLabels: Record<WorkProgressStage, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "Awaiting Parts",
  INSPECTION: "Inspection",
  COMPLETED: "Completed",
}

const priorityBadgeStyles: Record<WorkPriority, string> = {
  URGENT: "bg-red-50 text-red-700 ring-1 ring-red-200/60 font-semibold",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/60",
  NORMAL: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
}

export default function MaintenanceWorkTable({
  workOrders = [],
  isLoading = false,
  onViewWorkOrder,
}: MaintenanceWorkTableProps) {
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<"ALL" | WorkProgressStage>(
    "ALL"
  )
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | WorkPriority>(
    "ALL"
  )
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | MaintenanceTrade
  >("ALL")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      if (stageFilter !== "ALL" && order.stage !== stageFilter) return false
      if (priorityFilter !== "ALL" && order.priority !== priorityFilter)
        return false
      if (categoryFilter !== "ALL" && order.category !== categoryFilter)
        return false

      if (search.trim()) {
        const query = search.toLowerCase()
        const titleMatch = order.title.toLowerCase().includes(query)
        const jobIdMatch = order.jobId.toLowerCase().includes(query)
        const locationMatch = order.location.toLowerCase().includes(query)
        const workerMatch = order.assignedWorkerName
          ?.toLowerCase()
          .includes(query)

        if (!titleMatch && !jobIdMatch && !locationMatch && !workerMatch) {
          return false
        }
      }

      return true
    })
  }, [workOrders, stageFilter, priorityFilter, categoryFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, page, pageSize])

  const hasActiveFilters =
    search.trim().length > 0 ||
    stageFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL"

  const resetFilters = () => {
    setSearch("")
    setStageFilter("ALL")
    setPriorityFilter("ALL")
    setCategoryFilter("ALL")
    setPage(1)
  }

  const formatDate = (timeStr?: string) => {
    if (!timeStr) return "—"
    const date = new Date(timeStr)
    return Number.isNaN(date.getTime()) ? timeStr : date.toLocaleDateString()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Search and Filters Toolbar */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by job ID, maintenance work, location, or assigned worker..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          {/* Work Status Filter */}
          <div className="relative w-full sm:w-[170px]">
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value as "ALL" | WorkProgressStage)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="ALL">All Work Statuses</option>
              <option value="ASSIGNED">Worker Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">Awaiting Parts</option>
              <option value="INSPECTION">Under Inspection</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Priority Filter */}
          <div className="relative w-full sm:w-[150px]">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as "ALL" | WorkPriority)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Trade / Category Filter */}
          <div className="relative w-full sm:w-[160px]">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as "ALL" | MaintenanceTrade)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="ALL">All Trades</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="ELEVATOR">Elevator</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="PAINTING">Painting</option>
              <option value="CIVIL">Civil</option>
              <option value="GENERAL">General</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 lg:w-[100px]"
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[380px]">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <div className="size-8 animate-spin rounded-full border-2 border-[#0F5F45] border-t-transparent" />
            <p>Loading ongoing work progress...</p>
          </div>
        ) : paginatedOrders.length > 0 ? (
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3.5">Work / Job</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Assigned Worker</th>
                <th className="px-4 py-3.5">Status & Progress</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Target Timeline</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#0F5F45]">
                        {order.jobId}
                      </span>
                      <p className="font-medium text-slate-900 truncate max-w-[220px]">
                        {order.title}
                      </p>
                      <span className="text-xs text-slate-500">
                        {order.category}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-800">
                    {order.location}
                  </td>

                  {/* Assigned Worker (Which worker is working on it) */}
                  <td className="px-4 py-4">
                    {order.assignedWorkerName ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EE] text-xs font-semibold text-[#0F5F45]">
                          {order.assignedWorkerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {order.assignedWorkerName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {order.assignedWorkerTrade || "Technician"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Work Status & Visual Progress Bar */}
                  <td className="px-4 py-4 w-[190px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageBadgeStyles[order.stage]}`}
                        >
                          {stageLabels[order.stage]}
                        </span>
                        <span className="font-medium tabular-nums text-slate-700">
                          {order.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0F5F45] transition-all"
                          style={{ width: `${order.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${priorityBadgeStyles[order.priority]}`}
                    >
                      {order.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {formatDate(order.estimatedCompletion)}
                    </p>
                    <p className="text-slate-400">
                      Target Completion
                    </p>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewWorkOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* Empty State (Clean zero-data view without assignment buttons) */
          <div className="flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
              <Wrench size={26} strokeWidth={2.25} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters
                ? "No matching works found"
                : "No maintenance works currently in progress"}
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              {hasActiveFilters
                ? "There are no works matching your selected filters. Try resetting search or status criteria."
                : "Real-time updates on active property repairs, ongoing jobs, and on-duty technicians will appear here as works take place."}
            </p>

            {hasActiveFilters && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {filteredOrders.length > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(page * pageSize, filteredOrders.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {filteredOrders.length}
          </span>{" "}
          works
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="px-2.5 text-xs font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
