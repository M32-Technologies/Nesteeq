"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import {
  X,
  Car,
  Home,
  User,
  Layers,
  MapPin,
  ChevronDown,
} from "lucide-react"

import { useAssignResidentParkingMutation } from "../hooks/use-parking-queries"
import {
  assignResidentSchema,
  type AssignResidentFormValues,
} from "../schemas/parking.schema"
import type { ParkingSlot } from "../types/parking.types"
import { getFlats, getResidents } from "../../users/api/users.api"

type AssignResidentDrawerProps = {
  slot: ParkingSlot | null
  open: boolean
  onClose: () => void
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
      vehicleNumber: "",
    },
  })

  // Fetch flats for dropdown
  const { data: flats = [], isLoading: isFlatsLoading } = useQuery({
    queryKey: ["apartment-flats-options"],
    queryFn: () => getFlats({ limit: 500 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch residents for dropdown
  const { data: residentsData, isLoading: isResidentsLoading } = useQuery({
    queryKey: ["apartment-residents-options"],
    queryFn: () => getResidents({ limit: 500 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const residents = residentsData?.residents ?? []
  const selectedFlatId = form.watch("flatId")

  // Filter residents matching the selected flat
  const flatResidents = useMemo(() => {
    if (!selectedFlatId) return []
    const selectedFlat = flats.find(
      (f) => f.id === selectedFlatId || (f as any)._id === selectedFlatId
    )
    const flatNum = selectedFlat?.flatNumber
    return residents.filter((r) => r.flat === flatNum)
  }, [selectedFlatId, flats, residents])

  useEffect(() => {
    if (open && slot) {
      form.reset({
        flatId: "",
        residentId: "",
        vehicleNumber: "",
      })
    }
  }, [open, slot, form])

  if (!open || !slot) return null

  const handleSubmit = (values: AssignResidentFormValues) => {
    assignMutation.mutate(
      {
        parkingId: slot._id,
        input: {
          flatId: values.flatId,
          residentId: values.residentId ? values.residentId : undefined,
          vehicleNumber: values.vehicleNumber.trim().toUpperCase(),
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

  const zoneDisplay = slot.zoneName || slot.zoneCode || null

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Assign Parking Slot
            </h2>
            <p className="text-xs text-slate-500">
              Allocate slot {slot.slotNumber} to a resident
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={assignMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Slot Overview Pill */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 items-center rounded-lg bg-[#E7F4EE] px-2.5 font-bold text-xs text-[#0F5F45] border border-[#0F5F45]/15">
                {slot.slotNumber}
              </span>
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {slot.vehicleType.toLowerCase()} Parking
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {slot.level && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-600">
                  <Layers size={11} className="text-slate-400" />
                  {slot.level}
                </span>
              )}
              {zoneDisplay && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-600">
                  <MapPin size={11} className="text-slate-400" />
                  {zoneDisplay}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Clean, Non-Cluttered Form */}
        <form
          id="assign-parking-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col justify-between overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            {/* Field 1: Flat */}
            <div>
              <label
                htmlFor="assign-flat-select"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Home size={14} className="text-slate-400" />
                Select Flat <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="assign-flat-select"
                  {...form.register("flatId")}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
                >
                  <option value="">
                    {isFlatsLoading ? "Loading flats..." : "-- Choose flat --"}
                  </option>
                  {flats.map((flat) => {
                    const flatId = flat.id || (flat as any)._id
                    return (
                      <option key={flatId} value={flatId}>
                        Flat {flat.flatNumber}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>

              {form.formState.errors.flatId && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {form.formState.errors.flatId.message}
                </p>
              )}
            </div>

            {/* Field 2: Resident (Dynamically enabled) */}
            <div>
              <label
                htmlFor="assign-resident-select"
                className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  Resident Profile
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <div className="relative">
                <select
                  id="assign-resident-select"
                  {...form.register("residentId")}
                  disabled={!selectedFlatId}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none transition cursor-pointer hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {!selectedFlatId
                      ? "Select a flat first"
                      : isResidentsLoading
                      ? "Loading residents..."
                      : flatResidents.length > 0
                      ? "-- Choose resident (optional) --"
                      : "No resident profiles for this flat"}
                  </option>
                  {flatResidents.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} ({res.type || "Resident"})
                      {res.phone ? ` • ${res.phone}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            {/* Field 3: Vehicle Number */}
            <div>
              <label
                htmlFor="assign-vehicle-input"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Car size={14} className="text-slate-400" />
                Vehicle Plate Number <span className="text-red-500">*</span>
              </label>

              <input
                id="assign-vehicle-input"
                {...form.register("vehicleNumber")}
                placeholder="e.g. MH 12 AB 1234"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-slate-300 focus:outline-none focus-visible:outline-none focus:ring-0"
              />

              {form.formState.errors.vehicleNumber && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {form.formState.errors.vehicleNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Clean Footer Bar */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={assignMutation.isPending}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:opacity-50"
            >
              {assignMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Assigning...
                </>
              ) : (
                "Assign Slot"
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
