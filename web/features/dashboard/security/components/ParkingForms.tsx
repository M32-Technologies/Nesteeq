"use client"

import { Car } from "lucide-react"

import type { VisitorParkingSlot } from "../schemas/parking"
import type { SecurityFlat } from "../schemas/security"
import type { VisitorVisit } from "../schemas/visitor"
import {
  inputClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
  textareaClassName,
} from "./SecurityUi"

export interface ParkingAssignFormState {
  slotId: string
  flatId: string
  visitorVisitId: string
  visitorName: string
  vehicleNumber: string
  vehicleType: string
  notes: string
}

export function ParkingForms({
  assignForm,
  activeVisitors,
  activeVisitorsLoading,
  availableSlots,
  availableSlotsLoading,
  flats,
  flatsLoading,
  isAssigning,
  onAssign,
  onAssignFormChange,
}: {
  assignForm: ParkingAssignFormState
  activeVisitors: VisitorVisit[]
  activeVisitorsLoading: boolean
  availableSlots: VisitorParkingSlot[]
  availableSlotsLoading: boolean
  flats: SecurityFlat[]
  flatsLoading: boolean
  isAssigning: boolean
  onAssign: () => void
  onAssignFormChange: (form: ParkingAssignFormState) => void
}) {
  const handleVisitorVisitChange = (visitId: string) => {
    const visitor = activeVisitors.find(
      (visit) => visit._id === visitId
    )

    if (!visitor) {
      onAssignFormChange({
        ...assignForm,
        visitorVisitId: "",
      })
      return
    }

    onAssignFormChange({
      ...assignForm,
      visitorVisitId: visitor._id,
      flatId: visitor.flatId ?? assignForm.flatId,
      visitorName: visitor.visitorName,
      vehicleNumber: visitor.vehicleNumber ?? "",
      vehicleType: visitor.vehicleType ?? "",
    })
  }

  return (
    <div className={panelClassName}>
      <h2 className="text-base font-semibold text-[#111111]">
        Assign Parking
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Active Visitor
          </label>
          <select
            className={selectClassName}
            value={assignForm.visitorVisitId}
            onChange={(event) =>
              handleVisitorVisitChange(event.target.value)
            }
            disabled={activeVisitorsLoading}
          >
            <option value="">
              {activeVisitorsLoading
                ? "Loading active visitors..."
                : "Optional active visitor"}
            </option>
            {activeVisitors.map((visitor) => (
              <option key={visitor._id} value={visitor._id}>
                {visitor.visitorName} - Flat{" "}
                {visitor.flatNumber ?? "-"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Parking Slot
          </label>
          <select
            className={selectClassName}
            value={assignForm.slotId}
            onChange={(event) =>
              onAssignFormChange({
                ...assignForm,
                slotId: event.target.value,
              })
            }
            disabled={availableSlotsLoading}
          >
            <option value="">
              {availableSlotsLoading
                ? "Loading available slots..."
                : "Select available slot"}
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
            Flat / Unit Being Visited
          </label>
          <select
            className={selectClassName}
            value={assignForm.flatId}
            onChange={(event) =>
              onAssignFormChange({
                ...assignForm,
                flatId: event.target.value,
              })
            }
            disabled={flatsLoading}
          >
            <option value="">
              {flatsLoading ? "Loading flats..." : "Select flat"}
            </option>
            {flats.map((flat) => (
              <option key={flat._id} value={flat._id}>
                {flat.flatNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Visitor
          </label>
          <input
            className={inputClassName}
            value={assignForm.visitorName}
            onChange={(event) =>
              onAssignFormChange({
                ...assignForm,
                visitorName: event.target.value,
              })
            }
            placeholder="Visitor name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Vehicle Number
          </label>
          <input
            className={inputClassName}
            value={assignForm.vehicleNumber}
            onChange={(event) =>
              onAssignFormChange({
                ...assignForm,
                vehicleNumber: event.target.value,
              })
            }
            placeholder="Vehicle"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Vehicle Type
          </label>
          <input
            className={inputClassName}
            value={assignForm.vehicleType}
            onChange={(event) =>
              onAssignFormChange({
                ...assignForm,
                vehicleType: event.target.value,
              })
            }
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-[#111111]">
          Notes
        </label>
        <textarea
          className={textareaClassName}
          value={assignForm.notes}
          onChange={(event) =>
            onAssignFormChange({
              ...assignForm,
              notes: event.target.value,
            })
          }
          placeholder="Optional notes"
        />
      </div>

      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        disabled={isAssigning}
        onClick={onAssign}
      >
        <Car className="h-4 w-4" />
        {isAssigning ? "Assigning..." : "Assign Slot"}
      </button>
    </div>
  )
}
