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
  useReleaseParkingSlot,
} from "../hooks/useParking"
import type { VisitorParkingSlot } from "../schemas/parking"
import type { VisitorRecord } from "../schemas/visitor"
import { getSecurityApiErrorMessage } from "../utils/api-error"
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
    vehicleType: record.vehicleType ?? "",
  })
  const assignMutation = useAssignParkingSlot()
  const releaseMutation = useReleaseParkingSlot()

  const hasParking = Boolean(record.parkingSlotId)
  const hasActiveParking =
    hasParking && record.parkingAssignmentStatus === "ACTIVE"
  const canAssign =
    record.status === "ACTIVE" &&
    Boolean(record.visitId) &&
    Boolean(record.flatId) &&
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
      vehicleType: record.vehicleType ?? "",
    })
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!record.visitId || !record.flatId) {
      toast.error("Active visitor details are required")
      return
    }

    if (!form.slotId || !form.vehicleNumber.trim()) {
      toast.error("Parking slot and vehicle number are required")
      return
    }

    try {
      await assignMutation.mutateAsync({
        slotId: form.slotId,
        flatId: record.flatId,
        visitorVisitId: record.visitId,
        visitorName: record.visitorName,
        vehicleNumber: form.vehicleNumber,
        vehicleType: form.vehicleType || undefined,
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
                disabled={availableSlotsLoading}
                onChange={(event) =>
                  setForm({
                    ...form,
                    slotId: event.target.value,
                  })
                }
              >
                <option value="">
                  {availableSlotsLoading
                    ? "Loading slots..."
                    : "Select slot"}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.slotNumber}
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
              <input
                className={inputClassName}
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleType: event.target.value,
                  })
                }
                placeholder="Optional"
              />
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
