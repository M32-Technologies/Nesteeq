"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Car,
  Bike,
  Zap,
  MoreHorizontal,
  Layers,
  MapPin,
  Users,
  Hash,
  Sparkles,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
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
  icon: typeof Car | typeof Bike | typeof Zap | typeof MoreHorizontal
  hint: string
}[] = [
  { type: "CAR", label: "Car", code: "C", icon: Car, hint: "Standard 4-wheeler" },
  { type: "BIKE", label: "Bike / 2W", code: "B", icon: Bike, hint: "Two-wheeler" },
  { type: "EV", label: "EV Bay", code: "E", icon: Zap, hint: "With charging port" },
  { type: "OTHER", label: "Other", code: "O", icon: MoreHorizontal, hint: "Utility & custom" },
]

const LEVEL_OPTIONS = [
  "Basement 1",
  "Basement 2",
  "Basement 3",
  "Ground Floor",
  "Podium 1",
  "Level 1",
  "Level 2",
  "Level 3",
]

const ZONE_OPTIONS = [
  "Block A, North Wing",
  "Block B, South Wing",
  "Zone A",
  "Zone B",
  "Zone C",
  "East Wing",
  "West Wing",
  "Tower 1",
  "Tower 2",
]

export function GenerateSlotsDialog({ open, onClose }: GenerateSlotsDialogProps) {
  const generateMutation = useGenerateParkingSlotsMutation()
  const [successResult, setSuccessResult] =
    useState<GenerateParkingSlotsResponse | null>(null)

  const form = useForm<GenerateParkingSlotsFormValues>({
    resolver: zodResolver(generateParkingSlotsSchema),
    defaultValues: {
      level: "Basement 1",
      zoneName: "Block A, North Wing",
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
  const numberOfSlotsValue = useWatch({
    control: form.control,
    name: "numberOfSlots",
  })

  const slotsCount = Number(numberOfSlotsValue) || 10

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

  const adjustSlots = (delta: number) => {
    const current = form.getValues("numberOfSlots") || 10
    const nextVal = Math.max(1, Math.min(500, current + delta))
    form.setValue("numberOfSlots", nextVal, { shouldValidate: true })
  }

  return (
    <Portal>
      {/* Centered Modal Backdrop */}
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-slots-title"
      >
        <div className="w-full max-w-[620px] rounded-[24px] border border-slate-100 bg-white shadow-2xl transition-all overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between p-7 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5F0] text-[#0D5C43]">
                <Car className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div>
                <h2
                  id="generate-slots-title"
                  className="text-lg font-bold text-[#111827] leading-tight"
                >
                  Generate Parking Slots
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Batch provision numbered slots for a level and zone
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={generateMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 -mt-1 -mr-1"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          {/* Body */}
          {successResult ? (
            /* Success View */
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-7 pb-7 space-y-6">
              <div className="flex flex-col items-center text-center p-6 bg-[#EAF5F0]/60 border border-[#0D5C43]/20 rounded-2xl">
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#EAF5F0] text-[#0D5C43] mb-3.5 shadow-2xs">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {successResult.totalSlotsGenerated} Parking Slots Created
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm">
                  Successfully generated and indexed under sequence prefix{" "}
                  <span className="font-mono font-bold text-[#0D5C43] bg-white px-2 py-0.5 rounded border border-[#0D5C43]/20">
                    {successResult.prefix}
                  </span>
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <span className="text-[11px] font-medium text-slate-400 block">Level</span>
                  <span className="font-semibold text-xs text-slate-800 mt-0.5 block truncate">
                    {successResult.level}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <span className="text-[11px] font-medium text-slate-400 block">Zone Area</span>
                  <span className="font-semibold text-xs text-slate-800 mt-0.5 block truncate">
                    {successResult.zoneName || "General"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <span className="text-[11px] font-medium text-slate-400 block">Quantity</span>
                  <span className="font-bold text-xs text-[#0D5C43] mt-0.5 block">
                    {successResult.totalSlotsGenerated} slots
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <span className="text-[11px] font-medium text-slate-400 block">Prefix Tag</span>
                  <span className="font-mono font-bold text-xs text-slate-800 mt-0.5 block">
                    {successResult.prefix}
                  </span>
                </div>
              </div>

              {/* Generated Slot Badges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Generated Slot Numbers
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {successResult.generatedSlots.length} slots
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  {successResult.generatedSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      {slot.slotNumber}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessResult(null)
                    form.reset({
                      level: form.getValues("level"),
                      zoneName: form.getValues("zoneName"),
                      usageType: form.getValues("usageType"),
                      vehicleType: form.getValues("vehicleType"),
                      numberOfSlots: 10,
                    })
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Generate Another Batch
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-xl bg-[#0D5C43] px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0A4734]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form
              onSubmit={form.handleSubmit(handleGenerateSubmit)}
              className="flex flex-1 flex-col justify-between overflow-hidden"
            >
              <div className="overflow-y-auto px-7 pb-6 space-y-5">
                {/* Error Banner */}
                {generateMutation.isError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      {(generateMutation.error as Error | null)?.message ||
                        "Failed to generate slots. Please verify input parameters."}
                    </div>
                  </div>
                )}

                {/* Row 1: Level / Floor & Zone / Wing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Level / Floor Input */}
                  <div>
                    <label
                      htmlFor="gen-level"
                      className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                    >
                      <Layers size={14} className="text-slate-400" />
                      Level / Floor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="gen-level"
                        disabled={generateMutation.isPending}
                        {...form.register("level")}
                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-900 outline-none transition cursor-pointer hover:border-slate-300 focus:border-[#0D5C43] focus:ring-1 focus:ring-[#0D5C43] disabled:bg-slate-50"
                      >
                        {LEVEL_OPTIONS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                    </div>
                    {form.formState.errors.level && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        {form.formState.errors.level.message}
                      </p>
                    )}
                  </div>

                  {/* Zone / Wing Input */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        Zone / Wing
                      </span>
                      <span className="text-xs font-normal text-slate-400">Optional</span>
                    </div>
                    <div className="relative">
                      <select
                        id="gen-zone"
                        disabled={generateMutation.isPending}
                        {...form.register("zoneName")}
                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-900 outline-none transition cursor-pointer hover:border-slate-300 focus:border-[#0D5C43] focus:ring-1 focus:ring-[#0D5C43] disabled:bg-slate-50"
                      >
                        <option value="">None / General Zone</option>
                        {ZONE_OPTIONS.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                    </div>
                    {form.formState.errors.zoneName && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        {form.formState.errors.zoneName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Usage Policy */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Users size={14} className="text-[#0D5C43]" />
                    Usage Policy <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Resident Slot Card */}
                    <button
                      type="button"
                      disabled={generateMutation.isPending}
                      onClick={() => form.setValue("usageType", "RESIDENT")}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition ${
                        selectedUsage === "RESIDENT"
                          ? "border-[#0D5C43] bg-[#F0F8F5]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition ${
                            selectedUsage === "RESIDENT"
                              ? "border-[#0D5C43]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selectedUsage === "RESIDENT" && (
                            <div className="h-2 w-2 rounded-full bg-[#0D5C43]" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-slate-900 block leading-tight">
                          Resident Slot
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Assigned to a specific flat or resident
                        </p>
                      </div>
                    </button>

                    {/* Visitor Slot Card */}
                    <button
                      type="button"
                      disabled={generateMutation.isPending}
                      onClick={() => form.setValue("usageType", "VISITOR")}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition ${
                        selectedUsage === "VISITOR"
                          ? "border-[#0D5C43] bg-[#F0F8F5]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition ${
                            selectedUsage === "VISITOR"
                              ? "border-[#0D5C43]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selectedUsage === "VISITOR" && (
                            <div className="h-2 w-2 rounded-full bg-[#0D5C43]" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-slate-900 block leading-tight">
                          Visitor Slot
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Temporary pass check-in at security
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Row 3: Vehicle Type */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Car size={14} className="text-[#0D5C43]" />
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {VEHICLE_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isSelected = selectedVehicle === opt.type
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          disabled={generateMutation.isPending}
                          onClick={() => form.setValue("vehicleType", opt.type)}
                          className={`relative flex flex-col items-center justify-center p-3.5 pt-4 rounded-xl border text-center transition ${
                            isSelected
                              ? "border-[#0D5C43] bg-[#F0F8F5]"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          {/* Top-left Radio Indicator */}
                          <div className="absolute top-2.5 left-2.5">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                                isSelected
                                  ? "border-[#0D5C43]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="h-1.5 w-1.5 rounded-full bg-[#0D5C43]" />
                              )}
                            </div>
                          </div>

                          {/* Center Icon */}
                          <div className="h-7 w-7 flex items-center justify-center text-slate-800 mb-1">
                            <Icon className="h-5.5 w-5.5 stroke-[1.75]" />
                          </div>

                          <span className="text-xs font-bold text-slate-900 block">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full block">
                            {opt.hint}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Row 4: Number of Slots to Create */}
                <div>
                  <label
                    htmlFor="gen-slots"
                    className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Hash size={14} className="text-slate-400" />
                    Number of Slots to Create <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Stepper Box */}
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white h-10 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        disabled={generateMutation.isPending || slotsCount <= 1}
                        onClick={() => adjustSlots(-1)}
                        className="w-9 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                        aria-label="Decrease slot count"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        id="gen-slots"
                        type="number"
                        min={1}
                        max={500}
                        disabled={generateMutation.isPending}
                        {...form.register("numberOfSlots", { valueAsNumber: true })}
                        className="w-14 h-full text-center font-bold text-sm text-slate-900 border-x border-slate-200 outline-none"
                      />
                      <button
                        type="button"
                        disabled={generateMutation.isPending || slotsCount >= 500}
                        onClick={() => adjustSlots(1)}
                        className="w-9 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                        aria-label="Increase slot count"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Quick Preset Pills */}
                    {[5, 10, 20, 50].map((count) => {
                      const isCountSelected = slotsCount === count
                      return (
                        <button
                          key={count}
                          type="button"
                          disabled={generateMutation.isPending}
                          onClick={() =>
                            form.setValue("numberOfSlots", count, { shouldValidate: true })
                          }
                          className={`h-10 px-3.5 rounded-xl border text-xs font-semibold transition ${
                            isCountSelected
                              ? "bg-[#0D5C43] text-white border-[#0D5C43] shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          +{count}
                        </button>
                      )
                    })}
                  </div>

                  {form.formState.errors.numberOfSlots && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {form.formState.errors.numberOfSlots.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 p-6 pt-3 pb-7 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={generateMutation.isPending}
                  className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="h-11 px-6 rounded-xl bg-[#0D5C43] hover:bg-[#0A4734] text-sm font-semibold text-white inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate {slotsCount} Slots
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  )
}

export const GenerateSlotsDrawer = GenerateSlotsDialog
