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
  UserCheck,
  UserX,
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
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
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
            onPageChange((current) => Math.min(totalPages, current + 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by slot number or vehicle plate..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="relative w-[130px] shrink-0">
              <select
                value={statusFilter}
                onChange={(event) =>
                  onStatusChange(event.target.value as ParkingStatusFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-400"
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

            <div className="relative w-[125px] shrink-0">
              <select
                value={usageFilter}
                onChange={(event) =>
                  onUsageChange(event.target.value as ParkingUsageFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-400"
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

            <div className="relative w-[125px] shrink-0">
              <select
                value={vehicleFilter}
                onChange={(event) =>
                  onVehicleChange(event.target.value as ParkingVehicleFilter)
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-400"
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

            <div className="relative w-[125px] shrink-0">
              <select
                value={levelFilter}
                onChange={(event) => onLevelChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-400"
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
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            <div className="relative w-[125px] shrink-0">
              <select
                value={zoneFilter}
                onChange={(event) => onZoneChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-400"
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
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
            <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalCount}</span> slots
          </div>
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                  viewMode === "table"
                    ? "bg-[#0F5F45] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table view"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-[#0F5F45] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "grid" ? (
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
          {!isLoading && slots.length === 0 && (
            <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
          )}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {renderPagination()}
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[400px] overflow-x-auto">
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
                    const zoneDisplay = slot.zoneName || slot.zoneCode || null

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
      </div>
    )}

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
    <div className="flex min-h-[350px] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-slate-900">No parking slots found</p>
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
  )
}
