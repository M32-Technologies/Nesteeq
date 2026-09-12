"use client"

import { useState } from "react"
import {
  Car,
  Bike,
  Zap,
  HelpCircle,
  Search,
  ChevronDown,
  RotateCcw,
  List,
  LayoutGrid,
  MoreVertical,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Power,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import type {
  ParkingSlot,
  ParkingSortOption,
  ParkingStatusFilter,
  ParkingUsageFilter,
  ParkingVehicleFilter,
  ParkingVehicleType,
} from "../types/parking.types"
import { useUpdateParkingStatusMutation } from "../hooks/use-parking-queries"
import { EditSlotDialog } from "./edit-slot-dialog"
import { AssignResidentDrawer } from "./assign-resident-drawer"
import { ReleaseSlotDialog } from "./release-slot-dialog"
import { ParkingStatusDialog } from "./parking-status-dialog"
import { ViewSlotDrawer } from "./view-slot-drawer"
import { ParkingGrid } from "./parking-grid"

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
  switch (type) {
    case "CAR":
      return Car
    case "BIKE":
      return Bike
    case "EV":
      return Zap
    default:
      return HelpCircle
  }
}

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", {
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

  // Drawer / Dialog states
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

  const updateStatusMutation = useUpdateParkingStatusMutation()

  const handleToggleStatus = (slot: ParkingSlot) => {
    const nextStatus: "AVAILABLE" | "INACTIVE" =
      slot.status === "AVAILABLE" ? "INACTIVE" : "AVAILABLE"
    setStatusAction({ slot, status: nextStatus })
    setOpenActionSlotId(null)
  }

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

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL" ||
    usageFilter !== "ALL" ||
    vehicleFilter !== "ALL" ||
    levelFilter.trim().length > 0 ||
    zoneFilter.trim().length > 0 ||
    sortOption !== "slot_asc"

  const startItem = totalCount > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, totalCount)

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-7">
        {/* ONE Single Row Filter Toolbar */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by slot number or vehicle plate..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-400 focus:outline-none focus-visible:outline-none focus:ring-0"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-[130px] shrink-0">
              <select
                value={statusFilter}
                onChange={(e) =>
                  onStatusChange(e.target.value as ParkingStatusFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Usage Filter */}
            <div className="relative w-[125px] shrink-0">
              <select
                value={usageFilter}
                onChange={(e) =>
                  onUsageChange(e.target.value as ParkingUsageFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              >
                <option value="ALL">All Usage</option>
                <option value="RESIDENT">Resident</option>
                <option value="VISITOR">Visitor</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Vehicle Filter */}
            <div className="relative w-[125px] shrink-0">
              <select
                value={vehicleFilter}
                onChange={(e) =>
                  onVehicleChange(e.target.value as ParkingVehicleFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              >
                <option value="ALL">All Vehicles</option>
                <option value="CAR">Car</option>
                <option value="BIKE">Bike</option>
                <option value="EV">EV</option>
                <option value="OTHER">Other</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Level Filter (100% Dynamic) */}
            <div className="relative w-[125px] shrink-0">
              <select
                value={levelFilter}
                onChange={(e) => onLevelChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              >
                <option value="">All Levels</option>
                {availableLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Zone Filter (100% Dynamic) */}
            <div className="relative w-[125px] shrink-0">
              <select
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              >
                <option value="">All Zones</option>
                {availableZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 shrink-0"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar: Showing count, Sort Dropdown, and View Switcher */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
            <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalCount}</span> slots
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 shrink-0">
                Sort by
              </span>
              <div className="relative w-[165px]">
                <select
                  value={sortOption}
                  onChange={(e) =>
                    onSortChange(e.target.value as ParkingSortOption)
                  }
                  className="h-8.5 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
                >
                  <option value="slot_asc">Slot number (A-Z)</option>
                  <option value="slot_desc">Slot number (Z-A)</option>
                  <option value="newest">Recently Updated</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
              </div>
            </div>

            {/* View Switcher Toggle (Table / Grid) */}
            {onViewModeChange && (
              <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => onViewModeChange("table")}
                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-md transition ${
                    viewMode === "table"
                      ? "bg-[#0F5F45] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Table View"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-[#0F5F45] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Separated Content Section: Grid View OR Table View */}
      {viewMode === "grid" ? (
        /* GRID VIEW: Free-standing grid cards (NOT enclosed in a giant white box) */
        <div className="mt-6 space-y-6">
          <ParkingGrid
            slots={slots}
            isLoading={isLoading}
            onViewSlot={openViewDrawer}
            onEditSlot={setEditSlot}
            onAssignSlot={openAssignDrawer}
            onReleaseSlot={setReleaseSlot}
            onToggleStatus={handleToggleStatus}
          />

          {/* Empty state for Grid View */}
          {!isLoading && slots.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-900">
                No parking slots found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hasActiveFilters
                  ? "Try changing your search or status filter."
                  : "Get started by generating your first batch of parking slots."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Grid View Pagination Footer Card */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
              <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalCount}</span> slots
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() =>
                  onPageChange((currentPage) => Math.max(1, currentPage - 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0F5F45] px-2 text-sm font-medium text-white shadow-sm"
              >
                {page}
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() =>
                  onPageChange((currentPage) =>
                    Math.min(totalPages, currentPage + 1)
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW: Standalone Table Container (Separated from Filter Toolbar) */
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Slot Number
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Usage
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Level / Zone
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Current Assignment
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Updated
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {/* Skeletons */}
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-16 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-16 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-24 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-28 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-20 rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-16 rounded bg-slate-100" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="ml-auto h-7 w-7 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))}

                {/* Data rows */}
                {!isLoading &&
                  slots.length > 0 &&
                  slots.map((slot) => {
                    const VehicleIcon = getVehicleIcon(slot.vehicleType)
                    const isActionOpen = openActionSlotId === slot._id

                    const flatNumber =
                      typeof slot.flatId === "object" && slot.flatId
                        ? slot.flatId.flatNumber
                        : null

                    const residentPhone =
                      typeof slot.residentId === "object" && slot.residentId
                        ? slot.residentId.phoneNumber || null
                        : null

                    const levelDisplay = slot.level || "—"
                    const zoneDisplay = slot.zoneName || slot.zoneCode || null

                    return (
                      <tr
                        key={slot._id}
                        className="transition hover:bg-slate-50/70 group"
                      >
                        {/* Slot Number */}
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
                              <VehicleIcon size={17} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                <button
                                  type="button"
                                  onClick={() => openViewDrawer(slot)}
                                  className="truncate text-left transition hover:text-[#0F5F45]"
                                >
                                  {slot.slotNumber}
                                </button>
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500 capitalize">
                                {slot.vehicleType.toLowerCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Usage */}
                        <td className="px-4 py-4 align-middle text-sm font-medium text-slate-800">
                          {slot.usageType === "RESIDENT" ? "Resident" : "Visitor"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusBadgeStyles[slot.status] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusDisplay[slot.status] || slot.status}
                          </span>
                        </td>

                        {/* Level / Zone (100% Dynamic) */}
                        <td className="px-4 py-4 align-middle text-sm text-slate-700">
                          <div>
                            <span className="font-medium text-slate-900">
                              {levelDisplay}
                            </span>
                            {zoneDisplay && (
                              <span className="text-xs text-slate-500 block">
                                Zone: {zoneDisplay}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Current Assignment */}
                        <td className="px-4 py-4 align-middle text-sm text-slate-600">
                          {flatNumber ? (
                            <div>
                              <div className="font-medium text-slate-900">
                                Flat {flatNumber}
                              </div>
                              {residentPhone && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {residentPhone}
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-4 align-middle text-sm text-slate-600">
                          {slot.vehicleNumber ? (
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {slot.vehicleNumber}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Updated */}
                        <td className="px-4 py-4 align-middle text-sm font-medium text-slate-600">
                          {formatDisplayDate(slot.updatedAt || slot.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right align-middle">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionSlotId((current) =>
                                  current === slot._id ? null : slot._id
                                )
                              }
                              aria-expanded={openActionSlotId === slot._id}
                              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openActionSlotId === slot._id && (
                              <div className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                                {/* Assign Resident Action */}
                                {slot.status === "AVAILABLE" &&
                                  slot.usageType === "RESIDENT" && (
                                    <button
                                      type="button"
                                      onClick={() => openAssignDrawer(slot)}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                                    >
                                      <UserCheck size={15} />
                                      Assign Resident
                                    </button>
                                  )}

                                {/* Release Slot Action */}
                                {slot.status === "ASSIGNED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReleaseSlot(slot)
                                      setOpenActionSlotId(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-50"
                                  >
                                    <UserX size={15} />
                                    Release Slot
                                  </button>
                                )}

                                {/* View Details Action */}
                                <button
                                  type="button"
                                  onClick={() => openViewDrawer(slot)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Eye size={15} />
                                  View Details
                                </button>

                                {/* Edit Slot Action */}
                                {slot.status !== "ASSIGNED" &&
                                  slot.status !== "OCCUPIED" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditSlot(slot)
                                        setOpenActionSlotId(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      <Pencil size={15} />
                                      Edit Slot
                                    </button>
                                  )}

                                <div className="my-1 border-t border-slate-100" />

                                {/* Deactivate / Activate Status Toggle */}
                                {slot.status === "AVAILABLE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(slot)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    <Power size={15} />
                                    Deactivate Slot
                                  </button>
                                )}

                                {slot.status === "INACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(slot)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                                  >
                                    <ShieldCheck size={15} />
                                    Activate Slot
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>

            {/* Empty state */}
            {!isLoading && slots.length === 0 && (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-4 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No parking slots found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveFilters
                    ? "Try changing your search or status filter."
                    : "Get started by generating your first batch of parking slots."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <RotateCcw size={14} />
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

        {/* Footer & Pagination matching Flats / Blocks table */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
            <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalCount}</span> slots
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() =>
                onPageChange((currentPage) => Math.max(1, currentPage - 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0F5F45] px-2 text-sm font-medium text-white shadow-sm"
            >
              {page}
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() =>
                onPageChange((currentPage) =>
                  Math.min(totalPages, currentPage + 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Drawers & Dialogs */}
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
        onAssignClick={(s) => {
          setIsViewOpen(false)
          setAssignSlot(s)
          setIsAssignOpen(true)
        }}
        onReleaseClick={(s) => {
          setIsViewOpen(false)
          setReleaseSlot(s)
        }}
        onEditClick={(s) => {
          setIsViewOpen(false)
          setEditSlot(s)
        }}
      />
    </>
  )
}
