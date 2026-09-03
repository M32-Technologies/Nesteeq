"use client"

import { useState } from "react"
import {
  Ban,
  Car,
  Check,
  Eye,
  MoreVertical,
  Search,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { useActiveVisitors } from "../hooks/useVisitors"
import {
  useAssignParkingSlot,
  useCreateParkingSlot,
  useParkingSlots,
  useReleaseParkingSlot,
  useUpdateParkingSlotStatus,
} from "../hooks/useParking"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityFlats } from "../hooks/useSecurityData"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import type {
  VisitorParkingSlot,
  VisitorParkingSlotStatus,
} from "../services/parking.service"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  formatDateTime,
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  primaryButtonClassName,
  tableClassName,
  tableWrapClassName,
  tdClassName,
  thClassName,
} from "./SecurityUi"
import { ParkingDetails } from "./ParkingDetails"
import {
  ParkingForms,
  type ParkingAssignFormState,
  type ParkingSlotFormState,
} from "./ParkingForms"
import { ParkingSummaryCards } from "./ParkingSummaryCards"

type ParkingStatusAction = Exclude<
  VisitorParkingSlotStatus,
  "ALL" | "OCCUPIED"
>

type ParkingStatusMenuItem = Exclude<
  VisitorParkingSlotStatus,
  "ALL"
>

const statusFilters: Array<{
  label: string
  value: VisitorParkingSlotStatus
}> = [
  { label: "All", value: "ALL" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Unavailable", value: "UNAVAILABLE" },
]

const parkingStatusActions = [
  {
    label: "Available",
    value: "AVAILABLE",
    icon: Car,
  },
  {
    label: "Occupied",
    value: "OCCUPIED",
    icon: Car,
  },
  {
    label: "Reserved",
    value: "RESERVED",
    icon: Ban,
  },
  {
    label: "Unavailable",
    value: "UNAVAILABLE",
    icon: Wrench,
  },
] satisfies Array<{
  label: string
  value: ParkingStatusMenuItem
  icon: typeof Car
}>

export function ParkingSlots() {
  const [status, setStatus] =
    useState<VisitorParkingSlotStatus>("ALL")
  const [search, setSearch] = useState("")
  const [selectedSlot, setSelectedSlot] =
    useState<VisitorParkingSlot | null>(null)
  const [openActionSlotId, setOpenActionSlotId] =
    useState<string | null>(null)
  const [slotForm, setSlotForm] =
    useState<ParkingSlotFormState>({
    slotNumber: "",
    notes: "",
  })
  const [assignForm, setAssignForm] =
    useState<ParkingAssignFormState>({
    slotId: "",
    flatId: "",
    visitorVisitId: "",
    visitorName: "",
    vehicleNumber: "",
    vehicleType: "",
    notes: "",
  })

  const debouncedSearch = useDebouncedValue(search, 350)
  const parkingQuery = useParkingSlots({
    status,
    search: debouncedSearch.trim() || undefined,
  })
  const availableSlotsQuery = useParkingSlots({
    status: "AVAILABLE",
  })
  const activeVisitorsQuery = useActiveVisitors(1, 100)
  const flatsQuery = useSecurityFlats()
  const createSlotMutation = useCreateParkingSlot()
  const assignMutation = useAssignParkingSlot()
  const releaseMutation = useReleaseParkingSlot()
  const updateStatusMutation = useUpdateParkingSlotStatus()

  const slots = parkingQuery.data?.slots ?? []
  const summary = parkingQuery.data?.summary
  const flats = flatsQuery.data?.flats ?? []

  const availableSlots = availableSlotsQuery.data?.slots ?? []

  const handleCreateSlot = async () => {
    if (!slotForm.slotNumber.trim()) {
      toast.error("Slot number is required")
      return
    }

    try {
      await createSlotMutation.mutateAsync({
        slotNumber: slotForm.slotNumber,
        notes: slotForm.notes || undefined,
      })

      toast.success("Parking slot created")
      setSlotForm({
        slotNumber: "",
        notes: "",
      })
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to create parking slot"
        )
      )
    }
  }

  const handleAssign = async () => {
    if (assignMutation.isPending) return

    if (
      !assignForm.slotId ||
      !assignForm.flatId ||
      !assignForm.visitorName.trim() ||
      !assignForm.vehicleNumber.trim()
    ) {
      toast.error("Slot, flat, visitor, and vehicle are required")
      return
    }

    try {
      await assignMutation.mutateAsync({
        slotId: assignForm.slotId,
        flatId: assignForm.flatId,
        visitorVisitId:
          assignForm.visitorVisitId || undefined,
        visitorName: assignForm.visitorName,
        vehicleNumber: assignForm.vehicleNumber,
        vehicleType: assignForm.vehicleType || undefined,
        notes: assignForm.notes || undefined,
      })

      toast.success("Parking slot assigned")
      setAssignForm({
        slotId: "",
        flatId: "",
        visitorVisitId: "",
        visitorName: "",
        vehicleNumber: "",
        vehicleType: "",
        notes: "",
      })
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to assign parking slot"
        )
      )
    }
  }

  const handleSlotStatus = async (
    slot: VisitorParkingSlot,
    nextStatus: ParkingStatusAction
  ) => {
    try {
      if (
        slot.status === "OCCUPIED" &&
        nextStatus === "AVAILABLE"
      ) {
        await releaseMutation.mutateAsync(slot._id)
        toast.success("Parking slot released")
      } else {
        await updateStatusMutation.mutateAsync({
          slotId: slot._id,
          status: nextStatus,
          notes: slot.notes || undefined,
        })

        toast.success("Parking slot updated")
      }

      setOpenActionSlotId(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to update parking slot"
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">
          Parking Slots
        </h1>
        <p className="text-sm text-[#637083]">
          Manage visitor parking availability, assignments, and releases.
        </p>
      </div>

      <ParkingSummaryCards summary={summary} />

      <ParkingForms
        assignForm={assignForm}
        activeVisitors={
          activeVisitorsQuery.data?.visitors ?? []
        }
        activeVisitorsLoading={activeVisitorsQuery.isLoading}
        availableSlots={availableSlots}
        availableSlotsLoading={availableSlotsQuery.isLoading}
        flats={flats}
        flatsLoading={flatsQuery.isLoading}
        isAssigning={assignMutation.isPending}
        isCreating={createSlotMutation.isPending}
        onAssign={handleAssign}
        onAssignFormChange={setAssignForm}
        onCreateSlot={handleCreateSlot}
        onSlotFormChange={setSlotForm}
        slotForm={slotForm}
      />

      <div className={panelClassName}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8782]" />
            <input
              type="search"
              className={`${inputClassName} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search slot number"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  status === filter.value
                    ? primaryButtonClassName
                    : outlineButtonClassName
                }
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {parkingQuery.isLoading ? (
        <LoadingState label="Loading visitor parking slots..." />
      ) : parkingQuery.isError ? (
        <ErrorState label="Unable to load parking slots." />
      ) : slots.length === 0 ? (
        <EmptyState
          title="No visitor parking slots found"
          description="Add visitor parking slots to start assigning vehicles."
        />
      ) : (
        <div className={tableWrapClassName}>
          <table className={tableClassName}>
            <thead>
              <tr>
                <th className={thClassName}>Slot Number</th>
                <th className={thClassName}>Vehicle Number</th>
                <th className={thClassName}>Visitor</th>
                <th className={thClassName}>Visiting Flat</th>
                <th className={thClassName}>Assigned Time</th>
                <th className={thClassName}>Status</th>
                <th className={thClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot._id}>
                  <td className={tdClassName}>
                    <p className="font-medium">{slot.slotNumber}</p>
                  </td>
                  <td className={tdClassName}>
                    {slot.currentAssignment?.vehicleNumber ?? "-"}
                  </td>
                  <td className={tdClassName}>
                    {slot.currentAssignment?.visitorName ?? "-"}
                  </td>
                  <td className={tdClassName}>
                    {slot.currentAssignment?.flatNumber ??
                      slot.currentAssignment?.flatId ??
                      "-"}
                  </td>
                  <td className={tdClassName}>
                    {formatDateTime(
                      slot.currentAssignment?.assignedAt
                    )}
                  </td>
                  <td className={tdClassName}>
                    <StatusBadge status={slot.status} />
                  </td>
                  <td className={tdClassName}>
                    <div className="relative flex justify-end">
                      <button
                        type="button"
                        aria-label={`Open actions for parking slot ${slot.slotNumber}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE3DF] bg-white text-[#111111] transition hover:bg-[#F7F8F5]"
                        onClick={() =>
                          setOpenActionSlotId((currentSlotId) =>
                            currentSlotId === slot._id
                              ? null
                              : slot._id
                          )
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openActionSlotId === slot._id ? (
                        <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-[#DDE3DF] bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[#111111] transition hover:bg-[#F7F8F5]"
                            onClick={() => {
                              setSelectedSlot(slot)
                              setOpenActionSlotId(null)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>

                          <div className="my-1 border-t border-[#EEF1F4]" />

                          {parkingStatusActions.map((action) => {
                            const StatusIcon = action.icon
                            const isCurrentStatus =
                              slot.status === action.value
                            const isOccupiedAction =
                              action.value === "OCCUPIED"
                            const isOccupiedSlot =
                              slot.status === "OCCUPIED"
                            const isDisabled =
                              isCurrentStatus ||
                              isOccupiedAction ||
                              (isOccupiedSlot &&
                                action.value !==
                                  "AVAILABLE") ||
                              releaseMutation.isPending ||
                              updateStatusMutation.isPending

                            return (
                              <button
                                key={action.value}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-[#111111] transition hover:bg-[#F7F8F5] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (isOccupiedAction) return

                                  handleSlotStatus(
                                    slot,
                                    action.value
                                  )
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <StatusIcon className="h-4 w-4" />
                                  {action.label}
                                </span>

                                {isCurrentStatus ? (
                                  <Check className="h-4 w-4 text-[#07584F]" />
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ParkingDetails
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  )
}
