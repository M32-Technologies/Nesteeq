"use client"

import { useState } from "react"
import {
  Calendar,
  Car,
  Bike,
  Zap,
  HelpCircle,
  CheckCircle2,
  Home,
  Phone,
  Power,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  X,
  Layers,
  MapPin,
  Pencil,
  Tag,
  Clock,
  Hash,
  Compass,
} from "lucide-react"

import type { ParkingSlot, ParkingVehicleType } from "../types/parking.types"
import { useParkingSlotDetailsQuery } from "../hooks/use-parking-queries"
import { ParkingStatusDialog } from "./parking-status-dialog"

type ViewSlotDrawerProps = {
  slot: ParkingSlot | null
  open: boolean
  onClose: () => void
  onAssignClick: (slot: ParkingSlot) => void
  onReleaseClick: (slot: ParkingSlot) => void
  onEditClick?: (slot: ParkingSlot) => void
}

const statusBadgeStyles: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Available",
  },
  ASSIGNED: {
    bg: "bg-blue-50 border-blue-200/80 text-blue-700",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Assigned",
  },
  OCCUPIED: {
    bg: "bg-rose-50 border-rose-200/80 text-rose-700",
    text: "text-rose-700",
    dot: "bg-rose-500",
    label: "Occupied",
  },
  INACTIVE: {
    bg: "bg-slate-100 border-slate-200 text-slate-600",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Out of Service",
  },
}

const renderVehicleIcon = (
  type: ParkingVehicleType,
  className: string,
  size: number
) => {
  const props = { size, className }
  if (type === "CAR") return <Car {...props} />
  if (type === "BIKE") return <Bike {...props} />
  if (type === "EV") return <Zap {...props} />
  return <HelpCircle {...props} />
}

export function ViewSlotDrawer({
  slot: initialSlot,
  open,
  onClose,
  onAssignClick,
  onReleaseClick,
  onEditClick,
}: ViewSlotDrawerProps) {
  const [statusDialogTarget, setStatusDialogTarget] = useState<
    "AVAILABLE" | "INACTIVE" | null
  >(null)

  // Fetch full details from single slot endpoint
  const { data: detailedSlot } = useParkingSlotDetailsQuery(
    open && initialSlot?._id ? initialSlot._id : null
  )

  if (!open || !initialSlot) return null

  // Fallback to initial slot while query populates
  const slot = detailedSlot ?? initialSlot

  const statusInfo = statusBadgeStyles[slot.status] || {
    bg: "bg-slate-50 border-slate-200 text-slate-700",
    text: "text-slate-700",
    dot: "bg-slate-400",
    label: slot.status,
  }

  const formattedDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const zoneDisplay = slot.zoneName || slot.zoneCode || null

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer Panel */}
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top Header Bar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
              <Car size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Parking Slot Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slot Profile Header Banner */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 min-w-[56px] shrink-0 items-center justify-center rounded-xl bg-[#E7F4EE] px-3 font-extrabold text-base tracking-tight text-[#0F5F45] border border-[#0F5F45]/15">
                {slot.slotNumber}
              </div>

              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Slot {slot.slotNumber}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  {slot.level && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200/80 px-2 py-0.5 font-medium text-slate-700">
                      <Layers size={11} className="text-slate-400" />
                      {slot.level}
                    </span>
                  )}

                  {zoneDisplay && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200/80 px-2 py-0.5 font-medium text-slate-700">
                      <MapPin size={11} className="text-slate-400" />
                      {zoneDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Card 1: Complete Slot Specifications */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-2.5 mb-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Slot Information
              </h4>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <Hash size={14} className="text-slate-400" />
                  Slot Number
                </span>
                <span className="font-bold text-slate-900 uppercase">
                  {slot.slotNumber}
                </span>
              </div>

              {slot.level && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" />
                    Level / Floor
                  </span>
                  <span className="font-semibold text-slate-800">
                    {slot.level}
                  </span>
                </div>
              )}

              {slot.zoneName && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    Zone Name
                  </span>
                  <span className="font-semibold text-slate-800">
                    {slot.zoneName}
                  </span>
                </div>
              )}

              {slot.zoneCode && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Compass size={14} className="text-slate-400" />
                    Zone Code
                  </span>
                  <span className="font-mono font-medium text-slate-700 uppercase">
                    {slot.zoneCode}
                  </span>
                </div>
              )}

              {slot.prefix && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Tag size={14} className="text-slate-400" />
                    Prefix Code
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {slot.prefix}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  {renderVehicleIcon(slot.vehicleType, "text-slate-400", 14)}
                  Vehicle Type
                </span>
                <span className="font-semibold text-slate-800 capitalize">
                  {slot.vehicleType.toLowerCase()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  Usage Type
                </span>
                <span className="font-semibold text-slate-800 capitalize">
                  {slot.usageType.toLowerCase()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-400" />
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusInfo.bg}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Assignment & Occupancy Details */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Assignment
              </h4>

              {slot.status === "ASSIGNED" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onReleaseClick(slot)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <UserX size={12} />
                  Release
                </button>
              )}
            </div>

            {slot.status === "ASSIGNED" || slot.flatId || slot.vehicleNumber ? (
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Home size={14} className="text-slate-400" />
                    Assigned Flat
                  </span>
                  <span className="font-bold text-slate-900">
                    {slot.flatId ? `Flat ${slot.flatId.flatNumber}` : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Car size={14} className="text-slate-400" />
                    Vehicle Plate
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold uppercase text-slate-900">
                    {slot.vehicleNumber || "-"}
                  </span>
                </div>

                {slot.residentId?.residentType && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      Resident Role
                    </span>
                    <span className="font-medium text-slate-800 capitalize">
                      {slot.residentId.residentType}
                    </span>
                  </div>
                )}

                {slot.residentId?.phoneNumber && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      Contact Phone
                    </span>
                    <span className="font-medium text-slate-800">
                      {slot.residentId.phoneNumber}
                    </span>
                  </div>
                )}

                {slot.assignedAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      Assigned On
                    </span>
                    <span className="font-medium text-slate-700">
                      {formattedDate(slot.assignedAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-800">
                  Slot is Currently Available
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Unassigned and ready for vehicle allocation.
                </p>

                {slot.usageType === "RESIDENT" && slot.status === "AVAILABLE" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onAssignClick(slot)
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0F5F45] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0B4D38]"
                  >
                    <UserCheck size={13} />
                    Assign to Resident
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Card 3: Availability & Service Status */}
          {(slot.status === "AVAILABLE" || slot.status === "INACTIVE") && (
            <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {slot.status === "AVAILABLE"
                      ? "Active & In Service"
                      : "Slot is Out of Service"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {slot.status === "AVAILABLE"
                      ? "Deactivate slot to mark out of service."
                      : "Reactivate slot to make it available."}
                  </p>
                </div>

                {slot.status === "AVAILABLE" ? (
                  <button
                    type="button"
                    onClick={() => setStatusDialogTarget("INACTIVE")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Power size={13} />
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatusDialogTarget("AVAILABLE")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <ShieldCheck size={13} />
                    Reactivate
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Card 4: Audit Record Timestamps */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock size={13} />
                Created:
              </span>
              <span className="font-medium text-slate-700">
                {formattedDate(slot.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock size={13} />
                Last Updated:
              </span>
              <span className="font-medium text-slate-700">
                {formattedDate(slot.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between gap-3">
          {onEditClick && slot.status !== "ASSIGNED" && slot.status !== "OCCUPIED" ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onEditClick(slot)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={13} />
              Edit Slot
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-9.5 rounded-lg border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </aside>

      {/* Canonical Status Dialog (Exact same style as FlatStatusDialog) */}
      <ParkingStatusDialog
        slot={slot}
        status={statusDialogTarget}
        open={Boolean(statusDialogTarget)}
        onClose={() => setStatusDialogTarget(null)}
      />
    </>
  )
}
