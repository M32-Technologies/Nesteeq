"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Car,
  Bike,
  Zap,
  HelpCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
  MapPin,
  Layers,
} from "lucide-react"

import { Portal } from "@/components/portal"
import { useGenerateParkingSlotsMutation } from "../hooks/use-parking-queries"
import {
  generateParkingSlotsSchema,
  type GenerateParkingSlotsFormValues,
} from "../schemas/parking.schema"
import type {
  GenerateParkingSlotsResponse,
  ParkingUsageType,
  ParkingVehicleType,
} from "../types/parking.types"

type GenerateSlotsDialogProps = {
  open: boolean
  onClose: () => void
}

const VEHICLE_OPTIONS: {
  type: ParkingVehicleType
  label: string
  code: string
  icon: typeof Car
}[] = [
    { type: "CAR", label: "Car", code: "C", icon: Car },
    { type: "BIKE", label: "Bike / 2W", code: "B", icon: Bike },
    { type: "EV", label: "EV", code: "E", icon: Zap },
    { type: "OTHER", label: "Other", code: "O", icon: HelpCircle },
  ]

export function GenerateSlotsDialog({ open, onClose }: GenerateSlotsDialogProps) {
  const generateMutation = useGenerateParkingSlotsMutation()
  const [successResult, setSuccessResult] =
    useState<GenerateParkingSlotsResponse | null>(null)

  const form = useForm<GenerateParkingSlotsFormValues>({
    resolver: zodResolver(generateParkingSlotsSchema),
    defaultValues: {
      level: "",
      zoneName: "",
      usageType: "RESIDENT",
      vehicleType: "CAR",
      numberOfSlots: 10,
    },
  })

  const selectedVehicle = useWatch({
    control: form.control,
    name: "vehicleType",
  })
  const selectedUsage = useWatch({
    control: form.control,
    name: "usageType",
  })
  const levelValue = useWatch({
    control: form.control,
    name: "level",
  })
  const zoneValue = useWatch({
    control: form.control,
    name: "zoneName",
  })
  const numberOfSlotsValue = useWatch({
    control: form.control,
    name: "numberOfSlots",
  })

  // Live prefix generation
  const previewLevel = levelValue?.trim()
    ? levelValue
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
    : "LVL"

  const previewZone = zoneValue?.trim()
    ? zoneValue
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
    : null

  const vehicleCode =
    VEHICLE_OPTIONS.find((v) => v.type === selectedVehicle)?.code || "C"

  const previewPrefix = [previewLevel, previewZone, vehicleCode]
    .filter(Boolean)
    .join("-")

  if (!open) return null

  const handleClose = () => {
    if (generateMutation.isPending) return
    form.reset()
    setSuccessResult(null)
    onClose()
  }

  const handleGenerateSubmit = (data: GenerateParkingSlotsFormValues) => {
    generateMutation.mutate(
      {
        level: data.level.trim(),
        zoneName: data.zoneName?.trim() || null,
        usageType: data.usageType,
        vehicleType: data.vehicleType,
        numberOfSlots: Number(data.numberOfSlots),
      },
      {
        onSuccess: (response) => {
          setSuccessResult(response)
        },
      }
    )
  }

  return (
    <Portal>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close generator drawer"
        onClick={handleClose}
        style={{ zIndex: 999 }}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer */}
      <aside
        style={{ zIndex: 1000, height: "100dvh" }}
        className="fixed right-0 top-0 bottom-0 flex h-full max-h-screen w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-slots-title"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div>
            <h2
              id="generate-slots-title"
              className="text-base font-bold text-slate-900"
            >
              Generate Parking Slots
            </h2>
            <p className="text-xs text-slate-500">
              Batch create slots for an apartment level & zone
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={generateMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          /* Success View */
          <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {successResult.totalSlotsGenerated} Slots Generated!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Slots created with prefix{" "}
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    {successResult.prefix}
                  </span>
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Level</span>
                  <span className="font-semibold text-slate-800">
                    {successResult.level}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Zone</span>
                  <span className="font-semibold text-slate-800">
                    {successResult.zoneName || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Added</span>
                  <span className="font-semibold text-[#0F5F45]">
                    {successResult.totalSlotsGenerated} slots
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Prefix</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {successResult.prefix}
                  </span>
                </div>
              </div>

              {/* Slot IDs */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Generated Slots:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  {successResult.generatedSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      {slot.slotNumber}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-lg bg-[#0F5F45] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B4D38]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Clean Form */
          <form
            onSubmit={form.handleSubmit(handleGenerateSubmit)}
            className="flex flex-1 flex-col justify-between overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              {/* Error Banner */}
              {generateMutation.isError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>{(generateMutation.error as Error | null)?.message || "Failed to generate slots"}</div>
                </div>
              )}

              {/* Level Input */}
              <div>
                <label
                  htmlFor="gen-level"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Layers size={14} className="text-slate-400" />
                  Level / Floor <span className="text-red-500">*</span>
                </label>
                <input
                  id="gen-level"
                  type="text"
                  disabled={generateMutation.isPending}
                  {...form.register("level")}
                  placeholder="e.g. Basement 1, Ground Floor"
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45] disabled:bg-slate-50"
                />
                {form.formState.errors.level && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {form.formState.errors.level.message}
                  </p>
                )}
              </div>

              {/* Zone Area Input */}
              <div>
                <label
                  htmlFor="gen-zone"
                  className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    Zone Area / Name
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">Optional</span>
                </label>
                <input
                  id="gen-zone"
                  type="text"
                  disabled={generateMutation.isPending}
                  {...form.register("zoneName")}
                  placeholder="e.g. Block A, North Wing"
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45] disabled:bg-slate-50"
                />
                {form.formState.errors.zoneName && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {form.formState.errors.zoneName.message}
                  </p>
                )}
              </div>

              {/* Number of Slots */}
              <div>
                <label
                  htmlFor="gen-slots"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Hash size={14} className="text-slate-400" />
                  Number of Slots <span className="text-red-500">*</span>
                </label>
                <input
                  id="gen-slots"
                  type="number"
                  min={1}
                  max={1000}
                  disabled={generateMutation.isPending}
                  {...form.register("numberOfSlots", { valueAsNumber: true })}
                  placeholder="e.g. 10"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45] disabled:bg-slate-50"
                />
                {form.formState.errors.numberOfSlots && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {form.formState.errors.numberOfSlots.message}
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
                        disabled={generateMutation.isPending}
                        onClick={() => form.setValue("usageType", usage)}
                        className={`h-10 rounded-lg border text-xs font-semibold transition ${isSelected
                            ? "border-[#0F5F45] bg-[#E7F4EE] text-[#0F5F45]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
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
                        disabled={generateMutation.isPending}
                        onClick={() => form.setValue("vehicleType", opt.type)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition ${isSelected
                            ? "border-[#0F5F45] bg-[#E7F4EE] text-[#0F5F45]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        <Icon
                          size={16}
                          className={isSelected ? "text-[#0F5F45]" : "text-slate-500"}
                        />
                        <span className="text-[11px] font-semibold mt-1">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Prefix Preview Card */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Slot Prefix Preview:</span>
                <span className="font-mono font-bold text-[#0F5F45] bg-[#E7F4EE] px-2 py-0.5 rounded text-xs border border-[#0F5F45]/15">
                  {previewPrefix}-001 ... {previewPrefix}-{String(numberOfSlotsValue || 1).padStart(3, "0")}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 px-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={generateMutation.isPending}
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generate Slots
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </aside>
    </Portal>
  )
}

export const GenerateSlotsDrawer = GenerateSlotsDialog
