"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Car,
  Bike,
  Zap,
  HelpCircle,
  AlertCircle,
  Layers,
  MapPin,
  ShieldCheck,
  Users,
  Info,
} from "lucide-react"

import { Portal } from "@/components/portal"
import { useUpdateParkingSlotMutation } from "../hooks/use-parking-queries"
import { editSlotSchema, type EditSlotFormValues } from "../schemas/parking.schema"
import type { ParkingSlot, ParkingVehicleType, ParkingUsageType } from "../types/parking.types"

type EditSlotDialogProps = {
  slot: ParkingSlot | null
  onClose: () => void
}

const VEHICLE_MAP: Record<
  ParkingVehicleType,
  { label: string; icon: typeof Car; colorClass: string }
> = {
  CAR: { label: "Car", icon: Car, colorClass: "text-blue-600 bg-blue-50 border-blue-200" },
  BIKE: { label: "Bike / 2W", icon: Bike, colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  EV: { label: "EV Dedicated", icon: Zap, colorClass: "text-amber-600 bg-amber-50 border-amber-200" },
  OTHER: { label: "Other", icon: HelpCircle, colorClass: "text-purple-600 bg-purple-50 border-purple-200" },
}

export function EditSlotDialog({ slot, onClose }: EditSlotDialogProps) {
  const updateSlotMutation = useUpdateParkingSlotMutation()

  const form = useForm<EditSlotFormValues>({
    resolver: zodResolver(editSlotSchema),
    defaultValues: {
      usageType: slot?.usageType || "RESIDENT",
    },
  })

  useEffect(() => {
    if (slot) {
      form.reset({
        usageType: slot.usageType,
      })
    }
  }, [slot, form])

  if (!slot) return null

  const isAssignedOrOccupied = slot.status === "ASSIGNED" || slot.status === "OCCUPIED"
  const selectedUsage = form.watch("usageType")
  const vehicleInfo = VEHICLE_MAP[slot.vehicleType] || VEHICLE_MAP.CAR
  const VehicleIcon = vehicleInfo.icon

  const handleEditSubmit = (data: EditSlotFormValues) => {
    updateSlotMutation.mutate(
      {
        parkingId: slot._id,
        input: {
          usageType: data.usageType,
        },
      },
      {
        onSuccess: onClose,
      }
    )
  }

  return (
    <Portal>
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-slot-title"
      >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all overflow-hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6">
          <div>
            <h2 id="edit-slot-title" className="text-base font-bold text-slate-900">
              Edit Slot Usage
            </h2>
            <p className="text-xs text-slate-500">
              Update allocation policy for slot <span className="font-bold uppercase text-slate-800">{slot.slotNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateSlotMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slot Identification Card */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Slot Identifier:</span>
              <span className="inline-flex items-center rounded-lg bg-[#E7F4EE] px-2.5 py-1 text-xs font-mono font-bold text-[#0F5F45] border border-[#0F5F45]/20 shadow-2xs">
                {slot.slotNumber}
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${slot.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : slot.status === "ASSIGNED"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : slot.status === "OCCUPIED"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
            >
              {slot.status}
            </span>
          </div>

          {/* Fixed Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white p-2 text-slate-700">
              <Layers size={14} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Level</span>
                <span className="font-semibold truncate block text-slate-800">{slot.level || "—"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white p-2 text-slate-700">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Zone / Block</span>
                <span className="font-semibold truncate block text-slate-800">
                  {slot.zoneName || slot.zoneCode || "Open Floor"}
                </span>
              </div>
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-slate-700">
              <div className="flex items-center gap-2">
                <VehicleIcon size={15} className="text-slate-500" />
                <span className="font-medium text-slate-600">Vehicle Specification:</span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${vehicleInfo.colorClass}`}>
                {vehicleInfo.label}
              </span>
            </div>
          </div>

          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info size={12} className="shrink-0" />
            Level, zone, and vehicle specifications are permanently bound to the slot prefix.
          </p>
        </div>

        {/* Warning if assigned/occupied */}
        {isAssignedOrOccupied && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-800">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Slot is currently {slot.status}</p>
              <p className="mt-0.5 text-amber-700">
                You must release this slot from its resident before you can reassign its usage type.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(handleEditSubmit)} className="p-6 space-y-5">
          {/* Usage Type */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Configured Usage Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(
                [
                  {
                    type: "RESIDENT",
                    title: "Resident Parking",
                    description: "Reserved exclusively for apartment flats and registered tenant vehicles.",
                    icon: ShieldCheck,
                  },
                  {
                    type: "VISITOR",
                    title: "Visitor / Guest Parking",
                    description: "Open for temporary visitors, daily deliveries, and security guest passes.",
                    icon: Users,
                  },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedUsage === opt.type
                return (
                  <button
                    key={opt.type}
                    type="button"
                    disabled={isAssignedOrOccupied}
                    onClick={() => form.setValue("usageType", opt.type)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition ${isSelected
                        ? "border-[#0F5F45] bg-[#E7F4EE]/60 text-slate-900 ring-2 ring-[#0F5F45]/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      } ${isAssignedOrOccupied ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isSelected
                          ? "bg-[#0F5F45] text-white border-[#0F5F45]"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? "text-[#0F5F45]" : "text-slate-800"}`}>
                          {opt.title}
                        </span>
                        {isSelected && (
                          <span className="inline-flex rounded-full bg-[#0F5F45] px-1.5 py-0.2 text-[10px] font-bold text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {form.formState.errors.usageType && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                {form.formState.errors.usageType.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateSlotMutation.isPending || isAssignedOrOccupied}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSlotMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Portal>
)
}
