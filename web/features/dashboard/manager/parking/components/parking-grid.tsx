"use client"

import { useState } from "react"
import {
  Car,
  Bike,
  Zap,
  HelpCircle,
  Layers,
  MapPin,
  MoreVertical,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Power,
  User,
} from "lucide-react"

import type { ParkingSlot, ParkingVehicleType } from "../types/parking.types"

type ParkingGridProps = {
  slots: ParkingSlot[]
  isLoading: boolean
  onViewSlot: (slot: ParkingSlot) => void
  onEditSlot: (slot: ParkingSlot) => void
  onAssignSlot: (slot: ParkingSlot) => void
  onReleaseSlot: (slot: ParkingSlot) => void
  onToggleStatus: (slot: ParkingSlot) => void
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

const statusBadgeStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200/60",
  OCCUPIED: "bg-rose-50 text-rose-700 border-rose-200/60",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200/60",
}

const statusDisplay: Record<string, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  OCCUPIED: "Occupied",
  INACTIVE: "Inactive",
}

const getVehicleBadgeStyles = (status: string) => {
  switch (status) {
    case "ASSIGNED":
      return "bg-blue-50 text-blue-600"
    case "OCCUPIED":
      return "bg-rose-50 text-rose-600"
    case "INACTIVE":
      return "bg-slate-100 text-slate-500"
    case "AVAILABLE":
    default:
      return "bg-[#E7F4EE] text-[#0F5F45]"
  }
}

export function ParkingGrid({
  slots,
  isLoading,
  onViewSlot,
  onEditSlot,
  onAssignSlot,
  onReleaseSlot,
  onToggleStatus,
}: ParkingGridProps) {
  const [openActionSlotId, setOpenActionSlotId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[185px] animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-full bg-slate-100" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {slots.map((slot) => {
        const VehicleIcon = getVehicleIcon(slot.vehicleType)
        const isActionOpen = openActionSlotId === slot._id

        const vehicleLabel =
          slot.vehicleType === "CAR"
            ? "Car"
            : slot.vehicleType === "BIKE"
            ? "Bike"
            : slot.vehicleType === "EV"
            ? "EV"
            : "Other"

        const usageLabel =
          slot.usageType === "RESIDENT" ? "Resident" : "Visitor"

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
          <div
            key={slot._id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
          >
            {/* Top Row: Icon + Slot Number + Status Badge */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getVehicleBadgeStyles(
                      slot.status
                    )}`}
                  >
                    <VehicleIcon size={18} strokeWidth={2} />
                  </div>
                  <h3 className="truncate text-[13px] font-bold tracking-tight text-slate-900">
                    {slot.slotNumber}
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    statusBadgeStyles[slot.status] || "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {statusDisplay[slot.status] || slot.status}
                </span>
              </div>

              {/* Middle Section: Location Details (100% Dynamic, NO hardcoded dummy data) */}
              <div className="mt-3.5 space-y-1.5 pl-0.5">
                {slot.level && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Layers size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate font-medium">{slot.level}</span>
                  </div>
                )}

                {zoneDisplay && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate font-medium">{zoneDisplay}</span>
                  </div>
                )}

                <div className="pt-0.5 text-[11px] font-medium text-slate-400">
                  {vehicleLabel} <span className="text-slate-300">|</span> {usageLabel}
                </div>
              </div>

              {/* Assignment Box (Real Data Only) */}
              {slot.status === "ASSIGNED" && (flatNumber || slot.vehicleNumber) && (
                <div className="mt-3 rounded-xl border border-blue-100/70 bg-blue-50/40 p-2.5 text-xs">
                  {flatNumber && (
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <User size={13} className="shrink-0 text-blue-600" />
                      <span className="truncate">Flat {flatNumber}</span>
                    </div>
                  )}
                  {residentPhone && (
                    <p className="mt-0.5 truncate pl-4 text-[11px] font-medium text-slate-500">
                      {residentPhone}
                    </p>
                  )}
                  {slot.vehicleNumber && (
                    <p className="mt-0.5 font-mono text-[10px] font-semibold text-blue-700 pl-4">
                      {slot.vehicleNumber}
                    </p>
                  )}
                </div>
              )}

              {slot.status === "OCCUPIED" && slot.vehicleNumber && (
                <div className="mt-3 rounded-xl border border-rose-100/70 bg-rose-50/40 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Car size={13} className="shrink-0 text-rose-600" />
                    <span className="font-mono text-[11px] font-bold text-rose-800 truncate">
                      {slot.vehicleNumber}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Menu */}
            <div className="mt-3 flex items-center justify-end pt-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenActionSlotId(isActionOpen ? null : slot._id)
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Slot Actions"
                >
                  <MoreVertical size={16} />
                </button>

                {isActionOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setOpenActionSlotId(null)}
                    />
                    <div className="absolute right-0 bottom-8 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          onViewSlot(slot)
                          setOpenActionSlotId(null)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={13} />
                        View Details
                      </button>

                      {slot.status !== "ASSIGNED" &&
                        slot.status !== "OCCUPIED" && (
                          <button
                            type="button"
                            onClick={() => {
                              onEditSlot(slot)
                              setOpenActionSlotId(null)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil size={13} />
                            Edit Slot
                          </button>
                        )}

                      {slot.usageType === "RESIDENT" &&
                        slot.status === "AVAILABLE" && (
                          <button
                            type="button"
                            onClick={() => {
                              onAssignSlot(slot)
                              setOpenActionSlotId(null)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#0F5F45] transition hover:bg-[#E7F4EE]/50"
                          >
                            <UserCheck size={13} />
                            Assign Resident
                          </button>
                        )}

                      {slot.usageType === "RESIDENT" &&
                        slot.status === "ASSIGNED" && (
                          <button
                            type="button"
                            onClick={() => {
                              onReleaseSlot(slot)
                              setOpenActionSlotId(null)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                          >
                            <UserX size={13} />
                            Release Slot
                          </button>
                        )}

                      {(slot.status === "AVAILABLE" ||
                        slot.status === "INACTIVE") && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleStatus(slot)
                            setOpenActionSlotId(null)
                          }}
                          className={`flex w-full items-center gap-2 border-t border-slate-100 px-3 py-1.5 text-xs font-medium transition ${
                            slot.status === "AVAILABLE"
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Power size={13} />
                          {slot.status === "AVAILABLE"
                            ? "Deactivate Slot"
                            : "Activate Slot"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
