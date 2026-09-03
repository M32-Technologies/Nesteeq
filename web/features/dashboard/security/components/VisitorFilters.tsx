"use client"

import { Search } from "lucide-react"

import type {
  VisitorRecordEntryType,
  VisitorRecordStatus,
} from "../services/visitor.service"
import {
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
} from "./SecurityUi"

const statusFilters: Array<{
  label: string
  value: VisitorRecordStatus
}> = [
  { label: "All", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Exited", value: "EXITED" },
]

const entryTypeFilters: Array<{
  label: string
  value: VisitorRecordEntryType
}> = [
  { label: "All Types", value: "ALL" },
  { label: "Pre-Approved / Pass", value: "PASS" },
  { label: "Manual", value: "MANUAL" },
]

export function VisitorFilters({
  entryType,
  search,
  status,
  onEntryTypeChange,
  onSearchChange,
  onStatusChange,
}: {
  entryType: VisitorRecordEntryType
  search: string
  status: VisitorRecordStatus
  onEntryTypeChange: (value: VisitorRecordEntryType) => void
  onSearchChange: (value: string) => void
  onStatusChange: (value: VisitorRecordStatus) => void
}) {
  return (
    <div className={panelClassName}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8782]" />
          <input
            type="search"
            className={`${inputClassName} pl-9`}
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search visitor, phone, flat, or vehicle"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                status === filter.value
                  ? primaryButtonClassName
                  : outlineButtonClassName
              }
              onClick={() => onStatusChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <select
          className={selectClassName}
          value={entryType}
          onChange={(event) =>
            onEntryTypeChange(
              event.target.value as VisitorRecordEntryType
            )
          }
        >
          {entryTypeFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
