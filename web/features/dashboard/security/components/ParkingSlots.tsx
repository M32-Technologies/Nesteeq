"use client"

import { useState } from "react"
import {
  Ban,
  Car,
  Eye,
  LogOut,
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
import { ConfirmActionModal } from "./ConfirmActionModal"
import { ParkingDetails } from "./ParkingDetails"
import {
  ParkingForms,
  type ParkingAssignFormState,
  type ParkingSlotFormState,
} from "./ParkingForms"
import { ParkingSummaryCards } from "./ParkingSummaryCards"

const statusFilters: Array<{
  label: string
  value: VisitorParkingSlotStatus
}> = [
  { label: "All", value: "ALL" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Out of Service", value: "OUT_OF_SERVICE" },
]

export function ParkingSlots() {
  const [status, setStatus] =
    useState<VisitorParkingSlotStatus>("ALL")
  const [search, setSearch] = useState("")
  const [selectedSlot, setSelectedSlot] =
    useState<VisitorParkingSlot | null>(null)
  const [releaseSlot, setReleaseSlot] =
    useState<VisitorParkingSlot | null>(null)
  const [slotForm, setSlotForm] =
    useState<ParkingSlotFormState>({
    slotNumber: "",
    status: "AVAILABLE" as Exclude<
      VisitorParkingSlotStatus,
      "ALL" | "OCCUPIED"
    >,
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
        status: slotForm.status,
        notes: slotForm.notes || undefined,
      })

      toast.success("Parking slot created")
      setSlotForm({
        slotNumber: "",
        status: "AVAILABLE",
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

  const handleRelease = async () => {
    if (!releaseSlot) return

    try {
      await releaseMutation.mutateAsync(releaseSlot._id)
      toast.success("Parking slot released")
      setReleaseSlot(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to release parking slot"
        )
      )
      throw error
    }
  }

  const handleSlotStatus = async (
    slot: VisitorParkingSlot,
    nextStatus: Exclude<
      VisitorParkingSlotStatus,
      "ALL" | "OCCUPIED"
    >
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        slotId: slot._id,
        status: nextStatus,
        notes: slot.notes || undefined,
      })

      toast.success("Parking slot updated")
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={outlineButtonClassName}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>

                      {slot.status === "OCCUPIED" ? (
                        <button
                          type="button"
                          className={primaryButtonClassName}
                          disabled={releaseMutation.isPending}
                          onClick={() => setReleaseSlot(slot)}
                        >
                          <LogOut className="h-4 w-4" />
                          Release
                        </button>
                      ) : null}

                      {slot.status === "AVAILABLE" ? (
                        <>
                          <button
                            type="button"
                            className={outlineButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() =>
                              handleSlotStatus(
                                slot,
                                "RESERVED"
                              )
                            }
                          >
                            <Ban className="h-4 w-4" />
                            Reserve
                          </button>
                          <button
                            type="button"
                            className={outlineButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() =>
                              handleSlotStatus(
                                slot,
                                "OUT_OF_SERVICE"
                              )
                            }
                          >
                            <Wrench className="h-4 w-4" />
                            Unavailable
                          </button>
                        </>
                      ) : null}

                      {slot.status === "RESERVED" ||
                      slot.status === "OUT_OF_SERVICE" ? (
                        <button
                          type="button"
                          className={outlineButtonClassName}
                          disabled={
                            updateStatusMutation.isPending
                          }
                          onClick={() =>
                            handleSlotStatus(
                              slot,
                              "AVAILABLE"
                            )
                          }
                        >
                          <Car className="h-4 w-4" />
                          Available
                        </button>
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

      <ConfirmActionModal
        actionLabel="Release Slot"
        isOpen={Boolean(releaseSlot)}
        isSubmitting={releaseMutation.isPending}
        message={
          releaseSlot
            ? `Release parking slot ${releaseSlot.slotNumber} for vehicle ${releaseSlot.currentAssignment?.vehicleNumber ?? "-"}?`
            : ""
        }
        title="Release Parking Slot"
        variant="danger"
        onClose={() => setReleaseSlot(null)}
        onConfirm={handleRelease}
      />
    </div>
  )
}
