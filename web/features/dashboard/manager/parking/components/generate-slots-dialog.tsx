"use client"

import { useMemo, useState } from "react"
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
  Sparkles,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"

import { Portal } from "@/components/portal"
import {
  useGenerateParkingSlotsMutation,
  useParkingSlotsQuery,
} from "../hooks/use-parking-queries"
import {
  generateParkingSlotsSchema,
  type GenerateParkingSlotsFormValues,
} from "../schemas/parking.schema"
import type {
  GenerateParkingSlotsResponse,
  ParkingUsageType,
  ParkingVehicleType,
} from "../types/parking.types"

type GenerateSlotsDrawerProps = {
  open: boolean
  onClose: () => void
}

const VEHICLE_OPTIONS: {
  type: ParkingVehicleType
  title: string
  subtitle: string
  icon: typeof Car | typeof Bike | typeof Zap | typeof MoreHorizontal
}[] = [
  {
    type: "CAR",
    title: "Car",
    subtitle: "Sedan, SUV & 4W",
    icon: Car,
  },
  {
    type: "BIKE",
    title: "Two-Wheeler",
    subtitle: "Motorcycle & Scooter",
    icon: Bike,
  },
  {
    type: "EV",
    title: "EV Bay",
    subtitle: "Charging Port",
    icon: Zap,
  },
  {
    type: "OTHER",
    title: "Other",
    subtitle: "Utility & Custom",
    icon: MoreHorizontal,
  },
]

export function GenerateSlotsDrawer({ open, onClose }: GenerateSlotsDrawerProps) {
  const generateMutation = useGenerateParkingSlotsMutation()
  const [successResult, setSuccessResult] =
    useState<GenerateParkingSlotsResponse | null>(null)

  // 1. Live parking slots to extract existing levels & zones in this property
  const { data: slotsData } = useParkingSlotsQuery({ limit: 100 })

  // Extract distinct levels already in use
  const existingLevels = useMemo(() => {
    const set = new Set<string>()
    slotsData?.parkingSlots?.forEach((slot) => {
      const lvl = slot.level?.trim()
      if (lvl) set.add(lvl)
    })
    return Array.from(set).sort()
  }, [slotsData?.parkingSlots])

  // Extract distinct zones already in use
  const existingZones = useMemo(() => {
    const set = new Set<string>()
    slotsData?.parkingSlots?.forEach((slot) => {
      const zone = slot.zoneName?.trim()
      if (zone) set.add(zone)
    })
    return Array.from(set).sort()
  }, [slotsData?.parkingSlots])

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
  const currentLevel = useWatch({
    control: form.control,
    name: "level",
  })
  const currentZone = useWatch({
    control: form.control,
    name: "zoneName",
  })
  const numberOfSlotsValue = useWatch({
    control: form.control,
    name: "numberOfSlots",
  })

  const slotsCount = Number(numberOfSlotsValue) || 10

  if (!open) return null

  const handleClose = () => {
    if (generateMutation.isPending) return
    form.reset({
      level: "",
      zoneName: "",
      usageType: "RESIDENT",
      vehicleType: "CAR",
      numberOfSlots: 10,
    })
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
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-slots-title"
      >
        {/* Backdrop */}
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        />

        {/* Right-Sliding Drawer Panel */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div className="w-screen max-w-[520px] bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* 1. DRAWER HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F4EE] text-[#0F5F45] border border-[#0F5F45]/15">
                  <Car size={20} strokeWidth={2} />
                </div>
                <div>
                  <h2
                    id="generate-slots-title"
                    className="text-base font-bold text-slate-900 leading-tight"
                  >
                    Add Parking Slots
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Batch create numbered parking slots for your complex.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={generateMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. DRAWER BODY */}
            {successResult ? (
              /* Success View */
              <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6 sm:p-7 space-y-6">
                <div className="flex flex-col items-center text-center p-6 bg-emerald-50/70 border border-[#0F5F45]/20 rounded-2xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0F5F45] mb-3 shadow-2xs">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {successResult.totalSlotsGenerated} Slots Generated
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm">
                    Successfully created under sequence prefix{" "}
                    <span className="font-mono font-bold text-[#0F5F45] bg-white px-2 py-0.5 rounded border border-[#0F5F45]/20">
                      {successResult.prefix}
                    </span>
                  </p>
                </div>

                {/* Summary Metadata */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Level</span>
                    <span className="font-semibold text-xs text-slate-800 mt-0.5 block truncate">
                      {successResult.level}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Zone / Block</span>
                    <span className="font-semibold text-xs text-slate-800 mt-0.5 block truncate">
                      {successResult.zoneName || "General"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Quantity</span>
                    <span className="font-bold text-xs text-[#0F5F45] mt-0.5 block">
                      {successResult.totalSlotsGenerated} slots
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Prefix</span>
                    <span className="font-mono font-bold text-xs text-slate-800 mt-0.5 block">
                      {successResult.prefix}
                    </span>
                  </div>
                </div>

                {/* Generated Slot Numbers List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Generated Slot Numbers
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {successResult.generatedSlots.length} slots
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 bg-slate-50/80 rounded-xl border border-slate-200">
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

                {/* Success Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add More to This Floor
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 rounded-lg bg-[#0F5F45] px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0B4D38]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Drawer Creation Form */
              <form
                onSubmit={form.handleSubmit(handleGenerateSubmit)}
                className="flex flex-1 flex-col justify-between overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5">
                  {/* Error Alert */}
                  {generateMutation.isError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        {(generateMutation.error as Error | null)?.message ||
                          "Failed to generate slots. Please verify input parameters."}
                      </div>
                    </div>
                  )}

                  {/* 1. Floor or Level Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="gen-level"
                        className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                      >
                        <Layers size={14} className="text-[#0F5F45]" />
                        Floor or Level
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">e.g. Basement 1, Ground, P1</span>
                    </div>

                    <input
                      id="gen-level"
                      type="text"
                      placeholder="Enter level (e.g. Basement 1, Ground, B1)"
                      disabled={generateMutation.isPending}
                      {...form.register("level")}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/15 disabled:bg-slate-50"
                    />

                    {/* Quick Pick: Existing Levels in Property */}
                    {existingLevels.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Pick existing level:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {existingLevels.map((lvl) => {
                            const isSelected = currentLevel?.trim().toLowerCase() === lvl.toLowerCase()
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                  form.setValue("level", lvl, { shouldValidate: true })
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                  isSelected
                                    ? "bg-[#0F5F45] text-white shadow-2xs font-semibold"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {isSelected && <Check size={12} strokeWidth={2.5} />}
                                {lvl}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {form.formState.errors.level && (
                      <p className="text-[11px] font-medium text-rose-600">
                        {form.formState.errors.level.message}
                      </p>
                    )}
                  </div>

                  {/* 2. Zone Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="gen-zone"
                        className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                      >
                        <MapPin size={14} className="text-[#0F5F45]" />
                        Parking Zone
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>

                    <input
                      id="gen-zone"
                      type="text"
                      placeholder="Enter zone name (e.g. A Zone, B Zone)"
                      disabled={generateMutation.isPending}
                      {...form.register("zoneName")}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/15 disabled:bg-slate-50"
                    />

                    {/* Quick Pick: Existing Parking Zones Only */}
                    {existingZones.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Existing parking zones:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {existingZones.map((z) => {
                            const isSelected =
                              currentZone?.trim().toLowerCase() === z.toLowerCase()
                            return (
                              <button
                                key={z}
                                type="button"
                                onClick={() =>
                                  form.setValue("zoneName", z, {
                                    shouldValidate: true,
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                  isSelected
                                    ? "bg-[#0F5F45] text-white shadow-2xs font-semibold"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {isSelected && <Check size={12} strokeWidth={2.5} />}
                                {z}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {form.formState.errors.zoneName && (
                      <p className="text-[11px] font-medium text-rose-600">
                        {form.formState.errors.zoneName.message}
                      </p>
                    )}
                  </div>

                  {/* 3. Slot Allocation (Usage Policy) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#0F5F45]" />
                      Allocation Type
                      <span className="text-rose-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Resident Slot Card */}
                      <button
                        type="button"
                        disabled={generateMutation.isPending}
                        onClick={() => form.setValue("usageType", "RESIDENT")}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                          selectedUsage === "RESIDENT"
                            ? "border-[#0F5F45] bg-[#E7F4EE]/40 ring-1 ring-[#0F5F45]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                              selectedUsage === "RESIDENT"
                                ? "border-[#0F5F45] bg-[#0F5F45]"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selectedUsage === "RESIDENT" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            Resident Slot
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Reserved for flat owners or tenants
                          </p>
                        </div>
                      </button>

                      {/* Visitor Slot Card */}
                      <button
                        type="button"
                        disabled={generateMutation.isPending}
                        onClick={() => form.setValue("usageType", "VISITOR")}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                          selectedUsage === "VISITOR"
                            ? "border-[#0F5F45] bg-[#E7F4EE]/40 ring-1 ring-[#0F5F45]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                              selectedUsage === "VISITOR"
                                ? "border-[#0F5F45] bg-[#0F5F45]"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selectedUsage === "VISITOR" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            Visitor Slot
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Open for security guest check-ins
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4. Vehicle Category */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Car size={14} className="text-[#0F5F45]" />
                      Vehicle Category
                      <span className="text-rose-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VEHICLE_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        const isSelected = selectedVehicle === opt.type
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            disabled={generateMutation.isPending}
                            onClick={() => form.setValue("vehicleType", opt.type)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                              isSelected
                                ? "border-[#0F5F45] bg-[#E7F4EE]/40 ring-1 ring-[#0F5F45]"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                          >
                            <div className="h-6 w-6 flex items-center justify-center text-slate-800 mb-1">
                              <Icon className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {opt.title}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full block">
                              {opt.subtitle}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 5. Quantity Stepper & Quick Add */}
                  <div className="space-y-2">
                    <label
                      htmlFor="gen-slots"
                      className="text-xs font-semibold text-slate-800 block"
                    >
                      Number of Slots to Create <span className="text-rose-500">*</span>
                    </label>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Stepper Input */}
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white h-10 overflow-hidden shadow-2xs">
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

                      {/* Quick Presets */}
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
                            className={`h-10 px-3 rounded-lg border text-xs font-semibold transition ${
                              isCountSelected
                                ? "bg-[#0F5F45] text-white border-[#0F5F45] shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            +{count}
                          </button>
                        )
                      })}
                    </div>

                    {form.formState.errors.numberOfSlots && (
                      <p className="text-[11px] font-medium text-rose-600">
                        {form.formState.errors.numberOfSlots.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. STICKY DRAWER FOOTER */}
                <div className="shrink-0 border-t border-slate-200 bg-slate-50/70 p-4 px-6 sm:px-7 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={generateMutation.isPending}
                    className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="h-10 px-5 rounded-lg bg-[#0F5F45] hover:bg-[#0B4D38] text-xs font-semibold text-white inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Create {slotsCount} Slots
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

// Retain alias export for backwards compatibility
export const GenerateSlotsDialog = GenerateSlotsDrawer
