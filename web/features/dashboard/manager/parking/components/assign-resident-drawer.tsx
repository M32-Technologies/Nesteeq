"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import {
  X,
  Car,
  Bike,
  Zap,
  MoreHorizontal,
  Home,
  User,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Building2,
  Info,
  ChevronDown,
} from "lucide-react"

import { Portal } from "@/components/portal"
import { useAssignResidentParkingMutation } from "../hooks/use-parking-queries"
import {
  assignResidentSchema,
  type AssignResidentFormValues,
} from "../schemas/parking.schema"
import type { ParkingSlot, ParkingVehicleType } from "../types/parking.types"
import { getFlats, getResidents } from "../../users/api/users.api"
import type { FlatOption, ResidentUser } from "../../users/types/users"

type AssignResidentDrawerProps = {
  slot: ParkingSlot | null
  open: boolean
  onClose: () => void
}

const VEHICLE_ICONS: Record<
  ParkingVehicleType,
  typeof Car | typeof Bike | typeof Zap | typeof MoreHorizontal
> = {
  CAR: Car,
  BIKE: Bike,
  EV: Zap,
  OTHER: MoreHorizontal,
}

export function AssignResidentDrawer({
  slot,
  open,
  onClose,
}: AssignResidentDrawerProps) {
  const assignMutation = useAssignResidentParkingMutation()

  const form = useForm<AssignResidentFormValues>({
    resolver: zodResolver(assignResidentSchema),
    defaultValues: {
      flatId: "",
      residentId: "",
    },
  })

  // Fetch all flats for the apartment
  const { data: flats = [], isLoading: isFlatsLoading } = useQuery<FlatOption[]>({
    queryKey: ["apartment-flats-options"],
    queryFn: () => getFlats({ limit: 500 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch all residents
  const { data: residentsData, isLoading: isAllResidentsLoading } = useQuery({
    queryKey: ["apartment-residents-options"],
    queryFn: () => getResidents({ limit: 500 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const selectedFlatId = useWatch({
    control: form.control,
    name: "flatId",
  })

  const selectedResidentId = useWatch({
    control: form.control,
    name: "residentId",
  })

  // Fetch residents specifically for the selected flat
  const {
    data: flatSpecificResidentsData,
    isLoading: isFlatSpecificResidentsLoading,
  } = useQuery({
    queryKey: ["apartment-flat-residents", selectedFlatId],
    queryFn: () => getResidents({ flatId: selectedFlatId, limit: 50 }),
    enabled: open && Boolean(selectedFlatId),
    staleTime: 60 * 1000,
  })

  // Locate selected flat
  const selectedFlat = useMemo(() => {
    if (!selectedFlatId) return null
    return flats.find((f) => f.id === selectedFlatId) || null
  }, [selectedFlatId, flats])

  // Aggregate residents belonging to selected flat
  const flatResidents = useMemo<ResidentUser[]>(() => {
    if (!selectedFlatId) return []

    const specificList = flatSpecificResidentsData?.residents || []
    const allResidents = residentsData?.residents || []
    const flatNum = selectedFlat?.flatNumber?.trim().toLowerCase()

    const combined = [...specificList]

    for (const r of allResidents) {
      const matchesFlatId = r.flatId && r.flatId === selectedFlatId
      const matchesFlatNum =
        flatNum && r.flat && r.flat.trim().toLowerCase() === flatNum
      const matchesPrimaryResident =
        selectedFlat?.residentId && r.id === selectedFlat.residentId

      if (matchesFlatId || matchesFlatNum || matchesPrimaryResident) {
        if (!combined.some((item) => item.id === r.id)) {
          combined.push(r)
        }
      }
    }

    return combined
  }, [
    selectedFlatId,
    flatSpecificResidentsData?.residents,
    residentsData?.residents,
    selectedFlat,
  ])

  // Reset form when opened
  useEffect(() => {
    if (open && slot) {
      form.reset({
        flatId: "",
        residentId: "",
      })
    }
  }, [open, slot, form])

  // Auto-select if only 1 resident exists
  useEffect(() => {
    if (flatResidents.length === 1 && !selectedResidentId) {
      form.setValue("residentId", flatResidents[0].id, { shouldValidate: true })
    }
  }, [flatResidents, selectedResidentId, form])

  if (!open || !slot) return null

  const handleSubmit = (values: AssignResidentFormValues) => {
    assignMutation.mutate(
      {
        parkingId: slot._id,
        input: {
          flatId: values.flatId,
          residentId: values.residentId ? values.residentId : undefined,
        },
      },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      }
    )
  }

  const handleClose = () => {
    if (assignMutation.isPending) return
    form.reset()
    onClose()
  }

  const VehicleIcon = VEHICLE_ICONS[slot.vehicleType] || Car
  const zoneDisplay = slot.zoneName || slot.zoneCode || null
  const isResidentsLoading =
    isFlatSpecificResidentsLoading ||
    (isAllResidentsLoading && flatResidents.length === 0)

  return (
    <Portal>
      {/* Centered Modal Backdrop */}
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-parking-title"
      >
        <div className="w-full max-w-[620px] rounded-[24px] border border-slate-100 bg-white shadow-2xl transition-all overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between p-7 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5F0] text-[#0D5C43]">
                <VehicleIcon className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div>
                <h2
                  id="assign-parking-title"
                  className="text-lg font-bold text-[#111827] leading-tight"
                >
                  Assign Parking Slot
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Allocate slot to a flat and resident profile
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={assignMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 -mt-1 -mr-1"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          {/* Slot Identification Card */}
          <div className="mx-7 mb-4 rounded-xl border border-slate-200/80 bg-[#F9FAFB] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center font-mono font-bold text-xs bg-[#EAF5F0] text-[#0D5C43] px-2.5 py-1 rounded-lg border border-[#0D5C43]/20 shadow-2xs">
                {slot.slotNumber}
              </span>
              <span className="text-xs font-semibold text-slate-800 capitalize">
                {slot.vehicleType.toLowerCase()} Parking
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {slot.level && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-600">
                  <Layers size={11} className="text-slate-400" />
                  {slot.level}
                </span>
              )}
              {zoneDisplay && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-600">
                  <MapPin size={11} className="text-slate-400" />
                  {zoneDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Assignment Form */}
          <form
            id="assign-parking-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-1 flex-col justify-between overflow-hidden"
          >
            <div className="overflow-y-auto px-7 pb-6 space-y-5">
              {/* Error Banner */}
              {assignMutation.isError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    {(assignMutation.error as Error | null)?.message ||
                      "Failed to assign slot. Please check selection."}
                  </div>
                </div>
              )}

              {/* Step 1: Flat Selection */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Home size={14} className="text-slate-400" />
                    Select Flat <span className="text-red-500">*</span>
                  </span>
                  {selectedFlat && (
                    <span className="text-[11px] font-medium text-[#0D5C43] bg-[#EAF5F0] px-2 py-0.5 rounded border border-[#0D5C43]/20">
                      {selectedFlat.block?.blockname
                        ? `${selectedFlat.block.blockname} • Floor ${selectedFlat.floorNumber ?? "-"}`
                        : `Floor ${selectedFlat.floorNumber ?? "-"}`}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    id="assign-flat-select"
                    disabled={assignMutation.isPending || isFlatsLoading}
                    {...form.register("flatId", {
                      onChange: () => {
                        form.setValue("residentId", "")
                      },
                    })}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-900 outline-none transition cursor-pointer hover:border-slate-300 focus:border-[#0D5C43] focus:ring-1 focus:ring-[#0D5C43] disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {isFlatsLoading
                        ? "Loading apartment flats..."
                        : "-- Select Flat --"}
                    </option>
                    {flats.map((flat) => {
                      const blockLabel = flat.block?.blockname
                        ? `${flat.block.blockname} - `
                        : flat.block?.code
                        ? `${flat.block.code} - `
                        : ""
                      const statusLabel =
                        flat.occupancyStatus === "OWNER"
                          ? " (Owner)"
                          : flat.occupancyStatus === "TENANT"
                          ? " (Tenant)"
                          : " (Vacant)"
                      return (
                        <option key={flat.id} value={flat.id}>
                          Flat {flat.flatNumber} {blockLabel ? `(${blockLabel}Floor ${flat.floorNumber ?? "-"})` : ""}{statusLabel}
                        </option>
                      )
                    })}
                  </select>

                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {isFlatsLoading ? (
                      <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500" />
                    )}
                  </div>
                </div>

                {form.formState.errors.flatId && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {form.formState.errors.flatId.message}
                  </p>
                )}
              </div>

              {/* Step 2: Dynamic Resident Profile Cards */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-[#0D5C43]" />
                    Resident Profile
                  </span>
                  {selectedFlatId && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isResidentsLoading
                        ? "Fetching residents..."
                        : `${flatResidents.length} linked resident${
                            flatResidents.length === 1 ? "" : "s"
                          }`}
                    </span>
                  )}
                </div>

                {!selectedFlatId ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                    <Home size={22} className="mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-medium text-slate-600">
                      Please select a flat above
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Residents linked with the chosen flat will be displayed here
                    </p>
                  </div>
                ) : isResidentsLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 flex items-center justify-center gap-2.5 text-xs text-slate-500">
                    <Loader2 size={16} className="animate-spin text-[#0D5C43]" />
                    <span>Loading resident details for Flat {selectedFlat?.flatNumber}...</span>
                  </div>
                ) : flatResidents.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 gap-2.5">
                      {flatResidents.map((res) => {
                        const isSelected = selectedResidentId === res.id
                        const initials = res.name
                          ? res.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "R"
                        const isOwner =
                          res.type?.toLowerCase() === "owner" ||
                          res.type?.toLowerCase() === "resident_owner"

                        return (
                          <div
                            key={res.id}
                            onClick={() => {
                              form.setValue(
                                "residentId",
                                isSelected ? "" : res.id,
                                { shouldValidate: true }
                              )
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                              isSelected
                                ? "border-[#0D5C43] bg-[#F0F8F5]"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Radio Button */}
                              <div
                                className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? "border-[#0D5C43]"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-2 w-2 rounded-full bg-[#0D5C43]" />
                                )}
                              </div>

                              {/* Avatar Initials */}
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isSelected
                                    ? "bg-[#0D5C43] text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {initials}
                              </div>

                              {/* Details */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {res.name}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                      isOwner
                                        ? "bg-emerald-100/80 text-emerald-800"
                                        : "bg-blue-100/80 text-blue-800"
                                    }`}
                                  >
                                    {res.type || "Resident"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                  {res.phone && res.phone !== "-" && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Phone size={11} className="text-slate-400" />
                                      {res.phone}
                                    </span>
                                  )}
                                  {res.email && res.email !== "-" && (
                                    <span className="flex items-center gap-1 truncate max-w-[170px]">
                                      <Mail size={11} className="text-slate-400" />
                                      {res.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* No Residents Yet */
                  <div className="rounded-xl border border-slate-200 bg-[#F9FAFB] p-4">
                    <div className="flex items-start gap-2.5">
                      <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">
                          No active resident profile for Flat {selectedFlat?.flatNumber}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          This flat is currently vacant or the occupant hasn&apos;t onboarded yet. The slot will be reserved directly under Flat {selectedFlat?.flatNumber}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-6 pt-3 pb-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={assignMutation.isPending}
                className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={assignMutation.isPending || !selectedFlatId}
                className="h-11 px-6 rounded-xl bg-[#0D5C43] hover:bg-[#0A4734] text-sm font-semibold text-white inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Assigning Slot...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Assign Slot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

export const AssignResidentDialog = AssignResidentDrawer
