"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
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

const USAGE_OPTIONS: { type: ParkingUsageType; label: string; description: string }[] = [
  {
    type: "RESIDENT",
    label: "Resident",
    description: "Dedicated to residents and flat allocations",
  },
  {
    type: "VISITOR",
    label: "Visitor",
    description: "Available for visitors, guests, and passes",
  },
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

  if (!open) return null

  const selectedVehicle = form.watch("vehicleType")
  const selectedUsage = form.watch("usageType")
  const levelValue = form.watch("level")
  const zoneValue = form.watch("zoneName")
  const numberOfSlotsValue = form.watch("numberOfSlots")

  // Generate dynamic prefix preview for user feedback
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

  const handleClose = () => {
    if (generateMutation.isPending) return
    form.reset()
    setSuccessResult(null)
    onClose()
  }

  const handleGenerateSubmit = (data: GenerateParkingSlotsFormValues) => {
    // Strictly format payload according to backend API requirements
    const payload = {
      level: data.level.trim(),
      zoneName: data.zoneName?.trim() || null,
      usageType: data.usageType,
      vehicleType: data.vehicleType,
      numberOfSlots: Number(data.numberOfSlots),
    }

    generateMutation.mutate(payload, {
      onSuccess: (response) => {
        setSuccessResult(response)
      },
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-slots-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all overflow-hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2
                id="generate-slots-title"
                className="text-base font-semibold text-slate-900"
              >
                Generate Parking Slots
              </h2>
              <p className="text-xs text-slate-500">
                Batch generate sequential slots for a level and zone
              </p>
            </div>
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

        {/* Content Body */}
        {successResult ? (
          /* Success View */
          <div className="p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {successResult.totalSlotsGenerated} Slots Generated!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm">
                Slots have been created with prefix{" "}
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  {successResult.prefix}
                </span>{" "}
                and are now available for assignment.
              </p>
            </div>

            {/* Generated Summary Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Level</span>
                <span className="font-semibold text-slate-800">{successResult.level}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Zone</span>
                <span className="font-semibold text-slate-800">
                  {successResult.zoneName || "None"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Generated</span>
                <span className="font-semibold text-slate-800">
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

            {/* Slot Numbers Preview Chips */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Sample Generated Slots:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
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

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-lg bg-[#0F5F45] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38]"
              >
                Done & View Slots
              </button>
            </div>
          </div>
        ) : (
          /* Generation Form */
          <form
            onSubmit={form.handleSubmit(handleGenerateSubmit)}
            className="p-6 space-y-5 max-h-[calc(85vh-4rem)] overflow-y-auto"
          >
            {/* Error Banner */}
            {generateMutation.isError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Generation failed:</span>{" "}
                  {generateMutation.error?.message || "Please check inputs and try again."}
                </div>
              </div>
            )}

            {/* Level Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Layers size={14} className="text-slate-400" />
                Level Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={generateMutation.isPending}
                {...form.register("level")}
                placeholder="e.g., Basement 1, Ground Floor, Level 2"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:opacity-50"
              />
              {form.formState.errors.level && (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.level.message}
                </p>
              )}
            </div>

            {/* Zone Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <MapPin size={14} className="text-slate-400" />
                Zone Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                disabled={generateMutation.isPending}
                {...form.register("zoneName")}
                placeholder="e.g., North Side, Wing A, Visitor Bay"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:opacity-50"
              />
              {form.formState.errors.zoneName && (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.zoneName.message}
                </p>
              )}
            </div>

            {/* Number of Slots */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Hash size={14} className="text-slate-400" />
                Number of Slots <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                disabled={generateMutation.isPending}
                {...form.register("numberOfSlots", { valueAsNumber: true })}
                placeholder="e.g., 20"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:opacity-50"
              />
              {form.formState.errors.numberOfSlots && (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.numberOfSlots.message}
                </p>
              )}
            </div>

            {/* Usage Type Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Usage Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {USAGE_OPTIONS.map((opt) => {
                  const isSelected = selectedUsage === opt.type
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      disabled={generateMutation.isPending}
                      onClick={() => form.setValue("usageType", opt.type)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? "border-[#0F5F45] bg-[#E7F4EE]/60 text-slate-900 ring-1 ring-[#0F5F45]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? "text-[#0F5F45]" : "text-slate-800"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Vehicle Type <span className="text-rose-500">*</span>
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
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        isSelected
                          ? "border-[#0F5F45] bg-[#E7F4EE] text-[#0F5F45] font-semibold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      } disabled:opacity-50`}
                    >
                      <Icon
                        size={18}
                        className={isSelected ? "text-[#0F5F45]" : "text-slate-500"}
                      />
                      <span className="text-[11px] mt-1">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Estimated Prefix Live Preview Callout */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">Estimated Prefix:</span>
                <span className="font-mono font-bold text-[#0F5F45] bg-[#E7F4EE] px-2 py-0.5 rounded text-xs">
                  {previewPrefix}-001 ... {previewPrefix}-{String(numberOfSlotsValue || 1).padStart(3, "0")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                The backend will verify apartment capacity, determine sequential next numbers, and prevent duplicate slot numbers.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={generateMutation.isPending}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="flex items-center gap-2 h-10 rounded-lg bg-[#0F5F45] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Slots
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
