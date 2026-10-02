"use client"

import {
  ChevronDown,
  RotateCcw,
  Search,
} from "lucide-react"

import {
  complaintCategories,
  complaintStatuses,
  priorities,
  type ComplaintCategory,
  type ComplaintStatus,
  type Priority,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import { formatLabel } from "@/features/dashboard/facility/shared/components/facility-formatters"

export type ComplaintSortKey =
  | "newest"
  | "oldest"
  | "priority"
  | "status"
  | "category"

export const complaintSortOptions: { key: ComplaintSortKey; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "priority", label: "Highest Priority" },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
]

interface ComplaintsFiltersProps {
  search: string
  status: "all" | ComplaintStatus
  priority: "all" | Priority
  category: "all" | ComplaintCategory
  sort: ComplaintSortKey
  onSearchChange: (value: string) => void
  onStatusChange: (value: "all" | ComplaintStatus) => void
  onPriorityChange: (value: "all" | Priority) => void
  onCategoryChange: (value: "all" | ComplaintCategory) => void
  onSortChange: (value: ComplaintSortKey) => void
  onReset?: () => void
}

export function ComplaintsFilters({
  search,
  status,
  priority,
  category,
  sort,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSortChange,
  onReset,
}: ComplaintsFiltersProps) {
  const hasActiveFilters =
    Boolean(search.trim()) ||
    status !== "all" ||
    priority !== "all" ||
    category !== "all" ||
    sort !== "newest"

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      onSearchChange("")
      onStatusChange("all")
      onPriorityChange("all")
      onCategoryChange("all")
      onSortChange("newest")
    }
  }

  return (
    <div className="border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by ID, title, resident, or staff..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs sm:text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full sm:w-[160px]">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as "all" | ComplaintStatus)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          >
            <option value="all">All Statuses</option>
            {complaintStatuses.map((st) => (
              <option key={st} value={st}>
                {formatLabel(st)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Priority Dropdown */}
        <div className="relative w-full sm:w-[150px]">
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as "all" | Priority)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          >
            <option value="all">All Priorities</option>
            {priorities.map((pri) => (
              <option key={pri} value={pri}>
                {formatLabel(pri)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full sm:w-[160px]">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as "all" | ComplaintCategory)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          >
            <option value="all">All Categories</option>
            {complaintCategories.map((cat) => (
              <option key={cat} value={cat}>
                {formatLabel(cat)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative w-full sm:w-[160px]">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ComplaintSortKey)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          >
            {complaintSortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            title="Reset filters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default ComplaintsFilters
