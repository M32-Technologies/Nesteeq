"use client"

import { useState } from "react"
import {
  Car,
  Eye,
  LogIn,
  LogOut,
} from "lucide-react"
import { toast } from "sonner"

import {
  useAssignParkingSlot,
  useParkingSlots,
  useReleaseParkingSlot,
} from "../hooks/useParking"
import {
  getParkingVehicleTypeLabel,
  matchesParkingVehicleType,
  parkingVehicleTypeOptions,
  toParkingVehicleType,
} from "../constants/parking-vehicle-types"
import type { VisitorParkingSlot } from "../schemas/parking"
import type { VisitorRecord } from "../schemas/visitor"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import {
  isValidVehicleNumber,
  normalizeVehicleNumber,
} from "../utils/vehicle-validation"
import {
  DetailModal,
  inputClassName,
  outlineButtonClassName,
  primaryButtonClassName,
  selectClassName,
} from "./SecurityUi"
import {
  SecurityActionsMenu,
  type SecurityMenuAction,
} from "./SecurityActionsMenu"

type ParkingForm = {
  slotId: string
  vehicleNumber: string
  vehicleType: string
}

export function VisitorParkingActions({
  record,
  availableSlots,
  availableSlotsLoading,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckout,
  onView,
}: {
  record: VisitorRecord
  availableSlots: VisitorParkingSlot[]
  availableSlotsLoading: boolean
  isCheckingIn: boolean
  isCheckingOut: boolean
  onCheckIn: (record: VisitorRecord) => void
  onCheckout: (record: VisitorRecord) => void
  onView: (record: VisitorRecord) => void
}) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [form, setForm] = useState<ParkingForm>({
    slotId: "",
    vehicleNumber: record.vehicleNumber ?? "",
    vehicleType: toParkingVehicleType(record.vehicleType) ?? "",
  })
  const assignMutation = useAssignParkingSlot()
  const releaseMutation = useReleaseParkingSlot()
  const selectedVehicleType = toParkingVehicleType(form.vehicleType)
  const typedSlotsQuery = useParkingSlots(
    {
      status: "AVAILABLE",
      vehicleType: selectedVehicleType,
      limit: 100,
    },
    {
      enabled: assignOpen && Boolean(selectedVehicleType),
    }
  )
  const slotSource = selectedVehicleType
    ? typedSlotsQuery.data?.slots ?? availableSlots
    : availableSlots
  const filteredAvailableSlots = form.vehicleType
    ? slotSource.filter(
        (slot) =>
          slot.status === "AVAILABLE" &&
          !slot.currentAssignment &&
          matchesParkingVehicleType(slot.vehicleType, form.vehicleType)
      )
    : slotSource.filter(
        (slot) => slot.status === "AVAILABLE" && !slot.currentAssignment
      )
  const isLoadingSlots = selectedVehicleType
    ? typedSlotsQuery.isLoading
    : availableSlotsLoading
  const parkingSlotPlaceholder = (() => {
    if (isLoadingSlots) return "Loading slots..."
    if (form.vehicleType) {
      return `Select ${getParkingVehicleTypeLabel(form.vehicleType)} slot`
    }
    if (filteredAvailableSlots.length === 0) return "No available slots"

    return "Select parking slot"
  })()

  const hasParking = Boolean(record.parkingSlotId)
  const hasActiveParking =
    hasParking && record.parkingAssignmentStatus === "ACTIVE"
  const hasVehicle = Boolean(
    record.vehicleNumber &&
      record.vehicleNumber.trim() &&
      record.vehicleNumber.trim().toLowerCase() !== "no vehicle" &&
      record.vehicleNumber.trim().toLowerCase() !== "none"
  )
  const canAssign =
    record.status === "ACTIVE" &&
    Boolean(record.visitId) &&
    Boolean(record.flatId) &&
    hasVehicle &&
    !hasActiveParking
  const canRelease =
    record.status === "ACTIVE" &&
    Boolean(record.parkingSlotId) &&
    hasActiveParking
  const canCheckIn = record.status === "UPCOMING"
  const canCheckout = record.status === "ACTIVE"

  const openAssign = () => {
    setForm({
      slotId: "",
      vehicleNumber: record.vehicleNumber ?? "",
      vehicleType: toParkingVehicleType(record.vehicleType) ?? "",
    })
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!hasVehicle) {
      toast.error("Visitor has no vehicle to assign parking")
      return
    }

    if (!record.visitId || !record.flatId) {
      toast.error("Active visitor details are required")
      return
    }

    const normalizedVehicleNumber = normalizeVehicleNumber(
      form.vehicleNumber
    )
    const vehicleType = toParkingVehicleType(form.vehicleType)

    if (!form.slotId || !normalizedVehicleNumber || !vehicleType) {
      toast.error("Parking slot, vehicle number, and vehicle type are required")
      return
    }

    if (!isValidVehicleNumber(normalizedVehicleNumber)) {
      toast.error("Enter a valid vehicle number")
      return
    }

    try {
      await assignMutation.mutateAsync({
        slotId: form.slotId,
        flatId: record.flatId,
        visitorVisitId: record.visitId,
        visitorName: record.visitorName,
        vehicleNumber: normalizedVehicleNumber,
        vehicleType,
      })
      toast.success("Parking slot assigned")
      setAssignOpen(false)
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
    if (!record.parkingSlotId) return

    try {
      await releaseMutation.mutateAsync(record.parkingSlotId)
      toast.success("Parking slot released")
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to release parking slot"
        )
      )
    }
  }

  const actions: SecurityMenuAction[] = [
    {
      label: "View Details",
      icon: <Eye size={15} />,
      onClick: () => onView(record),
    },
  ]

  if (canCheckIn) {
    actions.push({
      label: "Check In",
      icon: <LogIn size={15} />,
      disabled: isCheckingIn || !record.visitorPassId,
      onClick: () => onCheckIn(record),
    })
  }

  if (canAssign) {
    actions.push({
      label: "Assign Slot",
      icon: <Car size={15} />,
      onClick: openAssign,
    })
  }

  if (canCheckout) {
    actions.push({
      label: "Check Out",
      icon: <LogOut size={15} />,
      disabled: isCheckingOut || !record.visitId,
      onClick: () => onCheckout(record),
    })
  }

  if (canRelease) {
    actions.push({
      label: "Release Slot",
      icon: <LogOut size={15} />,
      tone: "danger",
      disabled: releaseMutation.isPending,
      onClick: handleRelease,
    })
  }

  return (
    <>
      <SecurityActionsMenu
        actions={actions}
        label={`Open actions for ${record.visitorName}`}
      />

      {assignOpen ? (
        <DetailModal
          title="Assign Parking"
          subtitle={record.visitorName}
          onClose={() => setAssignOpen(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#111111]">
                Parking Slot
              </label>
              <select
                className={selectClassName}
                value={form.slotId}
                disabled={isLoadingSlots}
                onChange={(event) => {
                  const selectedSlot = slotSource.find(
                    (slot) => slot._id === event.target.value
                  )
                  setForm({
                    ...form,
                    slotId: event.target.value,
                    ...(selectedSlot?.vehicleType && !form.vehicleType
                      ? { vehicleType: selectedSlot.vehicleType }
                      : {}),
                  })
                }}
              >
                <option value="">{parkingSlotPlaceholder}</option>
                {filteredAvailableSlots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.slotNumber}
                    {slot.vehicleType
                      ? ` (${getParkingVehicleTypeLabel(slot.vehicleType)})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#111111]">
                Vehicle Number
              </label>
              <input
                className={inputClassName}
                value={form.vehicleNumber}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleNumber: event.target.value,
                  })
                }
                placeholder="Vehicle number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#111111]">
                Vehicle Type
              </label>
              <select
                className={selectClassName}
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleType: event.target.value,
                    slotId: "",
                  })
                }
              >
                <option value="">Select vehicle type</option>
                {parkingVehicleTypeOptions.map((vehicleType) => (
                  <option key={vehicleType.value} value={vehicleType.value}>
                    {vehicleType.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              className={outlineButtonClassName}
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={assignMutation.isPending}
              onClick={handleAssign}
            >
              <Car className="h-4 w-4" />
              {assignMutation.isPending ? "Assigning..." : "Assign Slot"}
            </button>
          </div>
        </DetailModal>
      ) : null}
    </>
  )
}
