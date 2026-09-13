"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Car, Bike, Zap, HelpCircle, AlertCircle, Layers, MapPin } from "lucide-react"

import { useUpdateParkingSlotMutation } from "../hooks/use-parking-queries"
import { editSlotSchema, type EditSlotFormValues } from "../schemas/parking.schema"
import type { ParkingSlot, ParkingVehicleType, ParkingUsageType } from "../types/parking.types"

type EditSlotDialogProps = {
  slot: ParkingSlot | null
  onClose: () => void
}

const VEHICLE_OPTIONS: { type: ParkingVehicleType; label: string; icon: typeof Car }[] = [
  { type: "CAR", label: "Car", icon: Car },
  { type: "BIKE", label: "Bike / 2W", icon: Bike },
  { type: "EV", label: "EV", icon: Zap },
  { type: "OTHER", label: "Other", icon: HelpCircle },
]

export function EditSlotDialog({ slot, onClose }: EditSlotDialogProps) {
  const updateSlotMutation = useUpdateParkingSlotMutation()

  const form = useForm<EditSlotFormValues>({
    resolver: zodResolver(editSlotSchema),
    defaultValues: {
      level: slot?.level || "",
      zoneName: slot?.zoneName || "",
      vehicleType: slot?.vehicleType || "CAR",
      usageType: slot?.usageType || "RESIDENT",
    },
  })

  useEffect(() => {
    if (slot) {
      form.reset({
        level: slot.level || "",
        zoneName: slot.zoneName || "",
        vehicleType: slot.vehicleType,
        usageType: slot.usageType,
      })
    }
  }, [slot, form])

  const selectedVehicle = useWatch({
    control: form.control,
    name: "vehicleType",
  })
  const selectedUsage = useWatch({
    control: form.control,
    name: "usageType",
  })

  if (!slot) return null

  const isAssignedOrOccupied = slot.status === "ASSIGNED" || slot.status === "OCCUPIED"

  const handleEditSubmit = (data: EditSlotFormValues) => {
    updateSlotMutation.mutate(
      {
        parkingId: slot._id,
        input: {
          level: data.level.trim(),
          zoneName: data.zoneName ? data.zoneName.trim() : null,
          vehicleType: data.vehicleType,
          usageType: data.usageType,
        },
      },
      {
        onSuccess: onClose,
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-slot-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h2 id="edit-slot-title" className="text-base font-bold text-slate-900">
              Edit Parking Slot
            </h2>
            <p className="text-xs text-slate-500">
              Update configuration for <span className="font-bold uppercase text-slate-800">Slot {slot.slotNumber}</span>
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

        {/* Read-Only Slot Number Banner */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Slot Number:</span>
            <span className="inline-flex items-center rounded-lg bg-[#E7F4EE] px-2.5 py-0.5 text-xs font-bold text-[#0F5F45] border border-[#0F5F45]/15">
              {slot.slotNumber}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Permanent Identifier</span>
        </div>

        {/* Warning if assigned/occupied */}
        {isAssignedOrOccupied && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-800">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Slot is currently {slot.status}</p>
              <p className="mt-0.5 text-amber-700">
                You must release this slot before you can modify its parking configuration.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(handleEditSubmit)} className="p-6 space-y-4">
          {/* Level / Floor */}
          <div>
            <label
              htmlFor="edit-level"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Layers size={14} className="text-slate-400" />
              Level / Floor <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-level"
              {...form.register("level")}
              disabled={isAssignedOrOccupied}
              placeholder="e.g. Basement 1, Ground Floor"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {form.formState.errors.level && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {form.formState.errors.level.message}
              </p>
            )}
          </div>

          {/* Zone Name */}
          <div>
            <label
              htmlFor="edit-zoneName"
              className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700"
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                Zone Area / Name
              </span>
              <span className="text-[11px] font-normal text-slate-400">Optional</span>
            </label>
            <input
              id="edit-zoneName"
              {...form.register("zoneName")}
              disabled={isAssignedOrOccupied}
              placeholder="e.g. North Side Parking, Wing A"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {form.formState.errors.zoneName && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {form.formState.errors.zoneName.message}
              </p>
            )}
          </div>

          {/* Usage Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Usage Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(["RESIDENT", "VISITOR"] as ParkingUsageType[]).map((usage) => {
                const isSelected = selectedUsage === usage
                return (
                  <button
                    key={usage}
                    type="button"
                    disabled={isAssignedOrOccupied}
                    onClick={() => form.setValue("usageType", usage)}
                    className={`h-9.5 rounded-lg border text-xs font-semibold transition ${
                      isSelected
                        ? "border-[#0F5F45] bg-[#E7F4EE] text-[#0F5F45]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } ${isAssignedOrOccupied ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {usage === "RESIDENT" ? "Resident" : "Visitor"}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedVehicle === opt.type
                return (
                  <button
                    key={opt.type}
                    type="button"
                    disabled={isAssignedOrOccupied}
                    onClick={() => form.setValue("vehicleType", opt.type)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition ${
                      isSelected
                        ? "border-[#0F5F45] bg-[#E7F4EE] text-[#0F5F45]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } ${isAssignedOrOccupied ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon size={16} className={isSelected ? "text-[#0F5F45]" : "text-slate-500"} />
                    <span className="text-[11px] font-semibold mt-1">{opt.label}</span>
                  </button>
                )
              })}
            </div>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
