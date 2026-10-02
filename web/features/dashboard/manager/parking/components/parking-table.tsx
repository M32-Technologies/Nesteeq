"use client"

import { useState } from "react"
import {
  Bike,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserX,
  X,
  Zap,
} from "lucide-react"

import type {
  ParkingSlot,
  ParkingSortOption,
  ParkingStatusFilter,
  ParkingUsageFilter,
  ParkingVehicleFilter,
  ParkingVehicleType,
} from "../types/parking.types"
import { AssignResidentDrawer } from "./assign-resident-drawer"
import { EditSlotDialog } from "./edit-slot-dialog"
import { ParkingGrid } from "./parking-grid"
import { ParkingStatusDialog } from "./parking-status-dialog"
import { ReleaseSlotDialog } from "./release-slot-dialog"
import { ViewSlotDrawer } from "./view-slot-drawer"

type ParkingTableProps = {
  slots: ParkingSlot[]
  statusFilter: ParkingStatusFilter
  usageFilter: ParkingUsageFilter
  vehicleFilter: ParkingVehicleFilter
  searchQuery: string
  levelFilter: string
  zoneFilter: string
  sortOption: ParkingSortOption
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  limit?: number
  viewMode?: "table" | "grid"
  availableLevels?: string[]
  availableZones?: string[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: ParkingStatusFilter) => void
  onUsageChange: (value: ParkingUsageFilter) => void
  onVehicleChange: (value: ParkingVehicleFilter) => void
  onLevelChange: (value: string) => void
  onZoneChange: (value: string) => void
  onSortChange: (value: ParkingSortOption) => void
  onClearFilters: () => void
  onPageChange: (value: number | ((value: number) => number)) => void
  onViewModeChange?: (value: "table" | "grid") => void
}

const statusBadgeStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  ASSIGNED: "bg-blue-50 text-blue-700",
  OCCUPIED: "bg-sky-50 text-sky-700",
  INACTIVE: "bg-red-50 text-red-600",
}

const statusDisplay: Record<string, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  OCCUPIED: "Occupied",
  INACTIVE: "Inactive",
}

const getVehicleIcon = (type: ParkingVehicleType) => {
  if (type === "CAR") return Car
  if (type === "BIKE") return Bike
  if (type === "EV") return Zap
  return HelpCircle
}

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function ParkingTable({
  slots,
  statusFilter,
  usageFilter,
  vehicleFilter,
  searchQuery,
  levelFilter,
  zoneFilter,
  sortOption,
  isLoading,
  page,
  totalPages,
  totalCount,
  limit = 10,
  viewMode = "table",
  availableLevels = [],
  availableZones = [],
  onSearchChange,
  onStatusChange,
  onUsageChange,
  onVehicleChange,
  onLevelChange,
  onZoneChange,
  onSortChange,
  onClearFilters,
  onPageChange,
  onViewModeChange,
}: ParkingTableProps) {
  const [openActionSlotId, setOpenActionSlotId] = useState<string | null>(null)
  const [editSlot, setEditSlot] = useState<ParkingSlot | null>(null)
  const [assignSlot, setAssignSlot] = useState<ParkingSlot | null>(null)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [releaseSlot, setReleaseSlot] = useState<ParkingSlot | null>(null)
  const [statusAction, setStatusAction] = useState<{
    slot: ParkingSlot
    status: "AVAILABLE" | "INACTIVE"
  } | null>(null)
  const [viewSlot, setViewSlot] = useState<ParkingSlot | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const isSearchActive = searchQuery.trim().length > 0
  const isStatusActive = statusFilter !== "ALL"
  const isUsageActive = usageFilter !== "ALL"
  const isVehicleActive = vehicleFilter !== "ALL"
  const isLevelActive = levelFilter.trim().length > 0
  const isZoneActive = zoneFilter.trim().length > 0
  const isSortActive = sortOption !== "slot_asc"

  const hasActiveFilters =
    isSearchActive ||
    isStatusActive ||
    isUsageActive ||
    isVehicleActive ||
    isLevelActive ||
    isZoneActive ||
    isSortActive

  const startItem = totalCount > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, totalCount)

  const openAssignDrawer = (slot: ParkingSlot) => {
    setAssignSlot(slot)
    setIsAssignOpen(true)
    setOpenActionSlotId(null)
  }

  const openViewDrawer = (slot: ParkingSlot) => {
    setViewSlot(slot)
    setIsViewOpen(true)
    setOpenActionSlotId(null)
  }

  const handleToggleStatus = (slot: ParkingSlot) => {
    const status = slot.status === "AVAILABLE" ? "INACTIVE" : "AVAILABLE"
    setStatusAction({ slot, status })
    setOpenActionSlotId(null)
  }

  const renderPagination = () => (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
      <p className="text-xs font-medium text-slate-500">
        Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalCount}</span> slots
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0F5F45] px-2 text-xs font-semibold text-white shadow-2xs">
          {page}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || isLoading}
          onClick={() =>
            onPageChange((current) => Math.min(totalPages, current + 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* Top Filters Toolbar */}
        <div className="border-b border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input with Clear Button */}
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search slot number or vehicle plate..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
              />
              {isSearchActive && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[125px]">
              <select
                value={statusFilter}
                onChange={(event) =>
                  onStatusChange(event.target.value as ParkingStatusFilter)
                }
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isStatusActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Usage Dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={usageFilter}
                onChange={(event) =>
                  onUsageChange(event.target.value as ParkingUsageFilter)
                }
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isUsageActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="ALL">All Usage</option>
                <option value="RESIDENT">Resident</option>
                <option value="VISITOR">Visitor</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Vehicle Dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={vehicleFilter}
                onChange={(event) =>
                  onVehicleChange(event.target.value as ParkingVehicleFilter)
                }
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isVehicleActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="ALL">All Vehicles</option>
                <option value="CAR">Car</option>
                <option value="BIKE">Two-Wheeler</option>
                <option value="EV">EV Bay</option>
                <option value="OTHER">Other</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Level Dropdown */}
            <div className="relative min-w-[125px]">
              <select
                value={levelFilter}
                onChange={(event) => onLevelChange(event.target.value)}
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isLevelActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="">All Levels</option>
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Zone Dropdown */}
            <div className="relative min-w-[130px]">
              <select
                value={zoneFilter}
                onChange={(event) => onZoneChange(event.target.value)}
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isZoneActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="">All Zones</option>
                {availableZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[135px]">
              <select
                value={sortOption}
                onChange={(event) => onSortChange(event.target.value as ParkingSortOption)}
                className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-xs font-medium outline-none transition cursor-pointer ${
                  isSortActive
                    ? "border-[#0F5F45] text-[#0F5F45] font-semibold bg-[#E7F4EE]/30"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <option value="slot_asc">Slot # (A &rarr; Z)</option>
                <option value="slot_desc">Slot # (Z &rarr; A)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* View Mode Switcher */}
            {onViewModeChange && (
              <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onViewModeChange("table")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    viewMode === "table"
                      ? "bg-[#0F5F45] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Table view"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-[#0F5F45] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Active Filter Chips Strip */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
                <SlidersHorizontal size={11} className="text-slate-400" />
                Active filters:
              </span>

              {isSearchActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear search"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isStatusActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Status: {statusDisplay[statusFilter] || statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => onStatusChange("ALL")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear status filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isUsageActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Usage: {usageFilter === "RESIDENT" ? "Resident" : "Visitor"}</span>
                  <button
                    type="button"
                    onClick={() => onUsageChange("ALL")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear usage filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isVehicleActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Vehicle: {vehicleFilter}</span>
                  <button
                    type="button"
                    onClick={() => onVehicleChange("ALL")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear vehicle filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isLevelActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Level: {levelFilter}</span>
                  <button
                    type="button"
                    onClick={() => onLevelChange("")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear level filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isZoneActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/20">
                  <span>Zone: {zoneFilter}</span>
                  <button
                    type="button"
                    onClick={() => onZoneChange("")}
                    className="hover:bg-[#0F5F45]/15 rounded p-0.5 transition"
                    aria-label="Clear zone filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {isSortActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <span>
                    Sort:{" "}
                    {sortOption === "newest"
                      ? "Newest First"
                      : sortOption === "oldest"
                        ? "Oldest First"
                        : sortOption === "slot_desc"
                          ? "Slot (Desc)"
                          : "Slot (Asc)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSortChange("slot_asc")}
                    className="hover:bg-slate-200 rounded p-0.5 transition"
                    aria-label="Reset sort"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={onClearFilters}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                <RotateCcw size={11} />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* View Mode Content */}
        {viewMode === "grid" ? (
          <div className="p-4 sm:p-6 space-y-6">
            <ParkingGrid
              slots={slots}
              isLoading={isLoading}
              onViewSlot={openViewDrawer}
              onEditSlot={setEditSlot}
              onAssignSlot={openAssignDrawer}
              onReleaseSlot={setReleaseSlot}
              onToggleStatus={handleToggleStatus}
            />
            {!isLoading && slots.length === 0 && (
              <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
            )}
            {renderPagination()}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {[
                    "Slot Number",
                    "Usage",
                    "Status",
                    "Level / Zone",
                    "Current Assignment",
                    "Vehicle",
                    "Updated",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 first:px-6"
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4 first:px-6">
                          <div className="h-4 w-20 rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading &&
                  slots.map((slot) => {
                    const VehicleIcon = getVehicleIcon(slot.vehicleType)
                    const flatNumber =
                      typeof slot.flatId === "object" && slot.flatId
                        ? slot.flatId.flatNumber
                        : null
                    const residentPhone =
                      typeof slot.residentId === "object" && slot.residentId
                        ? slot.residentId.phoneNumber || null
                        : null
                    const zoneDisplay = slot.zoneName?.trim() || null

                    return (
                      <tr
                        key={slot._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
                              <VehicleIcon size={17} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => openViewDrawer(slot)}
                                className="truncate text-left text-sm font-semibold text-slate-900 transition hover:text-[#0F5F45]"
                              >
                                {slot.slotNumber}
                              </button>
                              <p className="mt-0.5 truncate text-xs capitalize text-slate-500">
                            {slot.vehicleType.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-medium text-slate-800">
                      {slot.usageType === "RESIDENT" ? "Resident" : "Visitor"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeStyles[slot.status] ||
                          "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {statusDisplay[slot.status] || slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-slate-700">
                      <span className="font-medium text-slate-900">
                        {slot.level || "-"}
                      </span>
                      {zoneDisplay && (
                        <span className="block text-xs text-slate-500">
                          Zone: {zoneDisplay}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-slate-600">
                      {flatNumber ? (
                        <div>
                          <div className="font-medium text-slate-900">
                            Flat {flatNumber}
                          </div>
                          {residentPhone && (
                            <div className="mt-0.5 text-xs text-slate-500">
                              {residentPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-slate-600">
                      {slot.vehicleNumber ? (
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {slot.vehicleNumber}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-medium text-slate-600">
                      {formatDisplayDate(slot.updatedAt || slot.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <ActionsMenu
                        slot={slot}
                        open={openActionSlotId === slot._id}
                        onToggle={() =>
                          setOpenActionSlotId((current) =>
                            current === slot._id ? null : slot._id
                          )
                        }
                        onView={() => openViewDrawer(slot)}
                        onEdit={() => {
                          setEditSlot(slot)
                          setOpenActionSlotId(null)
                        }}
                        onAssign={() => openAssignDrawer(slot)}
                        onRelease={() => {
                          setReleaseSlot(slot)
                          setOpenActionSlotId(null)
                        }}
                        onStatus={() => handleToggleStatus(slot)}
                      />
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        {!isLoading && slots.length === 0 && (
          <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
        )}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {editSlot && (
        <EditSlotDialog slot={editSlot} onClose={() => setEditSlot(null)} />
      )}
      <AssignResidentDrawer
        slot={assignSlot}
        open={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false)
          setAssignSlot(null)
        }}
      />
      {releaseSlot && (
        <ReleaseSlotDialog
          slot={releaseSlot}
          onClose={() => setReleaseSlot(null)}
        />
      )}
      <ParkingStatusDialog
        slot={statusAction?.slot ?? null}
        status={statusAction?.status ?? null}
        open={Boolean(statusAction)}
        onClose={() => setStatusAction(null)}
      />
      <ViewSlotDrawer
        slot={viewSlot}
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false)
          setViewSlot(null)
        }}
        onAssignClick={(slot) => {
          setIsViewOpen(false)
          setAssignSlot(slot)
          setIsAssignOpen(true)
        }}
        onReleaseClick={(slot) => {
          setIsViewOpen(false)
          setReleaseSlot(slot)
        }}
        onEditClick={(slot) => {
          setIsViewOpen(false)
          setEditSlot(slot)
        }}
      />
    </>
  )
}

function ActionsMenu({
  slot,
  open,
  onToggle,
  onView,
  onEdit,
  onAssign,
  onRelease,
  onStatus,
}: {
  slot: ParkingSlot
  open: boolean
  onToggle: () => void
  onView: () => void
  onEdit: () => void
  onAssign: () => void
  onRelease: () => void
  onStatus: () => void
}) {
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
          {slot.status === "AVAILABLE" && slot.usageType === "RESIDENT" && (
            <button
              type="button"
              onClick={onAssign}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <UserCheck size={15} />
              Assign Resident
            </button>
          )}
          {slot.status === "ASSIGNED" && (
            <button
              type="button"
              onClick={onRelease}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-50"
            >
              <UserX size={15} />
              Release Slot
            </button>
          )}
          <button
            type="button"
            onClick={onView}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Eye size={15} />
            View Details
          </button>
          {slot.status !== "ASSIGNED" && slot.status !== "OCCUPIED" && (
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit Slot
            </button>
          )}
          <div className="my-1 border-t border-slate-100" />
          {slot.status === "AVAILABLE" && (
            <button
              type="button"
              onClick={onStatus}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Power size={15} />
              Deactivate Slot
            </button>
          )}
          {slot.status === "INACTIVE" && (
            <button
              type="button"
              onClick={onStatus}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <ShieldCheck size={15} />
              Activate Slot
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  hasActiveFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0F5F45]">
        <Car size={26} strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        {hasActiveFilters ? "No matching parking slots" : "No parking slots found"}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        {hasActiveFilters
          ? "No slots matched your selected zone, level, or filter criteria. Try adjusting or clearing your active filters."
          : "No parking slots have been generated for this property yet."}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0B4D38]"
        >
          <RotateCcw size={13} />
          Reset All Filters
        </button>
      )}
    </div>
  )
}
