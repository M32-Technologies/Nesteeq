"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  QrCode,
  RotateCcw,
  Search,
} from "lucide-react"

import type {
  VisitorEntryType,
  VisitorRecord,
  VisitorStatus,
} from "../types/visitors"

interface VisitorTableSectionProps {
  records?: VisitorRecord[]
  isLoading?: boolean
  onViewRecord: (record: VisitorRecord) => void
}

const statusBadgeStyles: Record<VisitorStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  EXPECTED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  CHECKED_OUT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  DENIED: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
}

const statusLabels: Record<VisitorStatus, string> = {
  ACTIVE: "Inside",
  EXPECTED: "Expected",
  CHECKED_OUT: "Checked Out",
  DENIED: "Denied",
}

export default function VisitorTableSection({
  records = [],
  isLoading = false,
  onViewRecord,
}: VisitorTableSectionProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | VisitorStatus>("ALL")
  const [entryTypeFilter, setEntryTypeFilter] = useState<
    "ALL" | VisitorEntryType
  >("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Filter records based on search and filter dropdowns
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Status dropdown
      if (statusFilter !== "ALL" && rec.status !== statusFilter) return false

      // Entry type dropdown
      if (entryTypeFilter !== "ALL" && rec.entryType !== entryTypeFilter)
        return false

      // Date filter
      if (dateFilter) {
        const entryTime = rec.checkedInAt || rec.expectedAt
        if (entryTime && !entryTime.startsWith(dateFilter)) {
          return false
        }
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase()
        const nameMatch = rec.visitorName.toLowerCase().includes(query)
        const phoneMatch = rec.visitorPhone?.toLowerCase().includes(query)
        const flatMatch = rec.flatNumber.toLowerCase().includes(query)
        const hostMatch = rec.residentName?.toLowerCase().includes(query)
        const vehicleMatch = rec.vehicleNumber?.toLowerCase().includes(query)

        if (
          !nameMatch &&
          !phoneMatch &&
          !flatMatch &&
          !hostMatch &&
          !vehicleMatch
        ) {
          return false
        }
      }

      return true
    })
  }, [records, statusFilter, entryTypeFilter, dateFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page, pageSize])

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "ALL" ||
    entryTypeFilter !== "ALL" ||
    dateFilter.length > 0

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setEntryTypeFilter("ALL")
    setDateFilter("")
    setPage(1)
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—"
    const date = new Date(timeStr)
    return Number.isNaN(date.getTime())
      ? timeStr
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
              placeholder="Search by visitor name, phone, flat, or vehicle..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full sm:w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ALL" | VisitorStatus)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Currently Inside</option>
              <option value="CHECKED_OUT">Checked Out</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Entry Type Dropdown */}
          <div className="relative w-full sm:w-[160px]">
            <select
              value={entryTypeFilter}
              onChange={(e) => {
                setEntryTypeFilter(e.target.value as "ALL" | VisitorEntryType)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              <option value="ALL">All Entry Types</option>
              <option value="PASS">Digital Pass</option>
              <option value="MANUAL">Gate Entry</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Date Picker */}
          <div className="relative w-full sm:w-[150px]">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
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

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[380px]">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <div className="size-8 animate-spin rounded-full border-2 border-[#0F5F45] border-t-transparent" />
            <p>Loading visitor history...</p>
          </div>
        ) : paginatedRecords.length > 0 ? (
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-4 py-3.5">Unit / Flat</th>
                <th className="px-4 py-3.5">Purpose</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Entry Type</th>
                <th className="px-4 py-3.5">Check-In</th>
                <th className="px-4 py-3.5">Check-Out</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EE] text-xs font-semibold text-[#0F5F45]">
                        {record.visitorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {record.visitorName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {record.visitorPhone || "No contact"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">
                      {record.flatNumber}
                    </p>
                    {record.residentName && (
                      <p className="text-xs text-slate-500 truncate">
                        {record.residentName}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600 truncate max-w-[150px]">
                    {record.purpose || "Personal Visit"}
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-mono text-xs">
                    {record.vehicleNumber || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                      {record.entryType === "PASS" ? (
                        <>
                          <QrCode size={13} className="text-[#0F5F45]" />
                          Pass
                        </>
                      ) : (
                        "Gate Entry"
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {formatTime(record.checkedInAt)}
                    </p>
                    <p className="text-slate-400">
                      {formatDate(record.checkedInAt)}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {formatTime(record.checkedOutAt)}
                    </p>
                    {record.checkedOutAt && (
                      <p className="text-slate-400">
                        {formatDate(record.checkedOutAt)}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[record.status]}`}
                    >
                      {statusLabels[record.status]}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewRecord(record)}
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
          /* Clean History Empty State (No dummy data) */
          <div className="flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-xs">
              <History size={26} strokeWidth={2} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters
                ? "No matching visitor history"
                : "No visitor history recorded"}
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              {hasActiveFilters
                ? "There are no visitor entries matching your current filters. Try resetting search or date filters."
                : "Gate check-ins, security logs, and visitor departures will appear here once recorded by gate security or residents."}
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
            {filteredRecords.length > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(page * pageSize, filteredRecords.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {filteredRecords.length}
          </span>{" "}
          records
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
