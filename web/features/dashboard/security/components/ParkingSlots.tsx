"use client"

import { useState } from "react"
import {
  Eye,
  LogOut,
  MoreVertical,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { useActiveVisitors } from "../hooks/useVisitors"
import {
  useAssignParkingSlot,
  useParkingSlots,
  useReleaseParkingSlot,
} from "../hooks/useParking"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityFlats } from "../hooks/useSecurityData"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import {
  isValidVehicleNumber,
  normalizeVehicleNumber,
} from "../utils/vehicle-validation"
import type {
  VisitorParkingSlot,
  VisitorParkingSlotStatus,
} from "../schemas/parking"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
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
  { label: "Unavailable", value: "UNAVAILABLE" },
]

const PARKING_PAGE_SIZE = 10
const ASSIGNMENT_SLOT_LIMIT = 100

export function ParkingSlots() {
  const [status, setStatus] =
    useState<VisitorParkingSlotStatus>("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedSlot, setSelectedSlot] =
    useState<VisitorParkingSlot | null>(null)
  const [openActionSlotId, setOpenActionSlotId] =
    useState<string | null>(null)
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
    page,
    limit: PARKING_PAGE_SIZE,
  })
  const availableSlotsQuery = useParkingSlots({
    status: "AVAILABLE",
    limit: ASSIGNMENT_SLOT_LIMIT,
  })
  const activeVisitorsQuery = useActiveVisitors(1, 100)
  const flatsQuery = useSecurityFlats()
  const assignMutation = useAssignParkingSlot()
  const releaseMutation = useReleaseParkingSlot()

  const slots = parkingQuery.data?.slots ?? []
  const summary = parkingQuery.data?.summary
  const flats = flatsQuery.data?.flats ?? []
  const pagination = parkingQuery.data?.pagination

  const availableSlots = (
    availableSlotsQuery.data?.slots ?? []
  ).filter(
    (slot) =>
      slot.status === "AVAILABLE" && !slot.currentAssignment
  )

  const handleAssign = async () => {
    if (assignMutation.isPending) return

    const normalizedVehicleNumber = normalizeVehicleNumber(
      assignForm.vehicleNumber
    )

    if (
      !assignForm.slotId ||
      !assignForm.flatId ||
      !assignForm.visitorName.trim() ||
      !normalizedVehicleNumber
    ) {
      toast.error("Slot, flat, visitor, and vehicle are required")
      return
    }

    if (!isValidVehicleNumber(normalizedVehicleNumber)) {
      toast.error("Enter a valid vehicle number")
      return
    }

    try {
      await assignMutation.mutateAsync({
        slotId: assignForm.slotId,
        flatId: assignForm.flatId,
        visitorVisitId:
          assignForm.visitorVisitId || undefined,
        visitorName: assignForm.visitorName,
        vehicleNumber: normalizedVehicleNumber,
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

  const setFilterStatus = (value: VisitorParkingSlotStatus) => {
    setStatus(value)
    setPage(1)
  }

  const setSearchQuery = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleReleaseSlot = async (slot: VisitorParkingSlot) => {
    try {
      await releaseMutation.mutateAsync(slot._id)
      toast.success("Parking slot released")
      setOpenActionSlotId(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to release parking slot"
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
          Assign visitors to property manager-created parking slots and release active assignments.
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
        onAssign={handleAssign}
        onAssignFormChange={setAssignForm}
      />

      <div className={panelClassName}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8782]" />
            <input
              type="search"
              className={`${inputClassName} pl-9`}
              value={search}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
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
                onClick={() => setFilterStatus(filter.value)}
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
          description="Property manager-created visitor parking slots will appear here."
        />
      ) : (
        <>
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
                      {slot.currentAssignment?.flatNumber ?? "-"}
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

                            {slot.status === "OCCUPIED" ? (
                              <>
                                <div className="my-1 border-t border-[#EEF1F4]" />
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[#111111] transition hover:bg-[#F7F8F5] disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={releaseMutation.isPending}
                                  onClick={() => handleReleaseSlot(slot)}
                                >
                                  <LogOut className="h-4 w-4" />
                                  Release Slot
                                </button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination ? (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              hasPreviousPage={pagination.page > 1}
              hasNextPage={
                pagination.page < pagination.totalPages
              }
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ParkingDetails
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  )
}
