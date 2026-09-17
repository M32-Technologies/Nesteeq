"use client"

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react"
import DeliveryDateRangePicker, {
  type DateRangeValue,
} from "./delivery-date-range-picker"
import type {
  DeliveryRecord,
  DeliveryType,
} from "../types/deliveries"

interface DeliveryTableSectionProps {
  records: DeliveryRecord[]
  totalRecords: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  search: string
  onSearchChange: (search: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  typeFilter: string
  onTypeFilterChange: (type: string) => void
  dateRange: DateRangeValue
  onDateRangeChange: (range: DateRangeValue) => void
  isLoading?: boolean
  onViewRecord: (record: DeliveryRecord) => void
}

const statusBadgeStyles: Record<string, string> = {
  WAITING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  NOTIFIED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  COLLECTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  RETURNED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
}

const statusDisplayLabels: Record<string, string> = {
  WAITING: "Pending",
  NOTIFIED: "Pending",
  COLLECTED: "Collected",
  RETURNED: "Returned",
}

const typeDisplayLabels: Record<DeliveryType, string> = {
  PARCEL: "Package",
  COURIER: "Document",
  FOOD: "Food",
  GROCERY: "Grocery",
  OTHER: "Other",
}

function formatReceivedAt(dateStr?: string) {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export default function DeliveryTableSection({
  records,
  totalRecords,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  dateRange,
  onDateRangeChange,
  isLoading = false,
  onViewRecord,
}: DeliveryTableSectionProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  const startIdx = totalRecords > 0 ? (page - 1) * pageSize + 1 : 0
  const endIdx = Math.min(page * pageSize, totalRecords)

  // Generate pagination buttons with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push("...")
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }
      if (page < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Header and Filters Toolbar */}
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Recent Deliveries
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Latest parcel deliveries across your apartment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 sm:w-72 sm:flex-none">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by flat, resident, company, tracking ID..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="ALL">All Status</option>
                <option value="WAITING">Pending</option>
                <option value="COLLECTED">Collected</option>
                <option value="RETURNED">Returned</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Type Dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => onTypeFilterChange(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="ALL">All Types</option>
                <option value="PARCEL">Package</option>
                <option value="COURIER">Document</option>
                <option value="FOOD">Food</option>
                <option value="GROCERY">Grocery</option>
                <option value="OTHER">Other</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Date Range Picker with Presets */}
            <DeliveryDateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
            <tr>
              <th className="py-3.5 pl-5 pr-3">#</th>
              <th className="px-3 py-3.5">Flat</th>
              <th className="px-3 py-3.5">Resident</th>
              <th className="px-3 py-3.5">Company</th>
              <th className="px-3 py-3.5">Type</th>
              <th className="px-3 py-3.5">
                <span className="inline-flex items-center gap-1">
                  Received At
                  <span className="text-slate-400">↓</span>
                </span>
              </th>
              <th className="px-3 py-3.5">Status</th>
              <th className="py-3.5 pl-3 pr-5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 pl-5 pr-5">
                    <div className="h-5 w-full rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-xs text-slate-400"
                >
                  No deliveries found matching your search or filters.
                </td>
              </tr>
            ) : (
              records.map((rec, index) => {
                const rowNum = (page - 1) * pageSize + index + 1
                const statusKey = rec.status || "WAITING"
                const badgeClass =
                  statusBadgeStyles[statusKey] || statusBadgeStyles.WAITING
                const statusLabel =
                  statusDisplayLabels[statusKey] || "Pending"

                return (
                  <tr
                    key={rec.id}
                    onClick={() => onViewRecord(rec)}
                    title="Click anywhere to view full delivery details"
                    className="cursor-pointer transition hover:bg-slate-50/90 group"
                  >
                    <td className="py-3.5 pl-5 pr-3 font-medium text-slate-400">
                      {rowNum}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-800">
                      {rec.flatNumber}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-800">
                      {rec.residentName || "—"}
                    </td>
                    <td className="px-3 py-3.5 text-slate-700">
                      {rec.deliveryCompany}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">
                      {typeDisplayLabels[rec.deliveryType] || rec.deliveryType}
                    </td>
                    <td className="px-3 py-3.5 text-slate-500">
                      {formatReceivedAt(rec.receivedAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td
                      className="py-3.5 pl-3 pr-5 text-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewRecord(rec)
                      }}
                    >
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{startIdx}</span>-
          <span className="font-semibold text-slate-700">{endIdx}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalRecords}</span>{" "}
          deliveries
        </p>

        <div className="flex items-center gap-3">
          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>

            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p as number)}
                  className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition ${page === p
                      ? "bg-[#0F5F45] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0F5F45]"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
