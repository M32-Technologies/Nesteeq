"use client"

import { Car, Plus } from "lucide-react"

import type { SecurityFlat } from "../services/security.interface"
import type {
  VisitorParkingSlot,
  VisitorParkingSlotStatus,
} from "../services/parking.service"
import type { VisitorVisit } from "../services/visitor.service"
import {
  inputClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
  textareaClassName,
} from "./SecurityUi"

export interface ParkingSlotFormState {
  slotNumber: string
  status: Exclude<
    VisitorParkingSlotStatus,
    "ALL" | "OCCUPIED"
  >
  notes: string
}

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
  isCreating,
  onAssign,
  onAssignFormChange,
  onCreateSlot,
  onSlotFormChange,
  slotForm,
}: {
  assignForm: ParkingAssignFormState
  activeVisitors: VisitorVisit[]
  activeVisitorsLoading: boolean
  availableSlots: VisitorParkingSlot[]
  availableSlotsLoading: boolean
  flats: SecurityFlat[]
  flatsLoading: boolean
  isAssigning: boolean
  isCreating: boolean
  onAssign: () => void
  onAssignFormChange: (form: ParkingAssignFormState) => void
  onCreateSlot: () => void
  onSlotFormChange: (form: ParkingSlotFormState) => void
  slotForm: ParkingSlotFormState
}) {
  const flatNumberById = new Map(
    flats.map((flat) => [flat._id, flat.flatNumber])
  )

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
      flatId: visitor.flatId,
      visitorName: visitor.visitorName,
      vehicleNumber: visitor.vehicleNumber ?? "",
    })
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className={panelClassName}>
        <h2 className="text-base font-semibold text-[#111111]">
          Add Visitor Slot
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111111]">
              Slot Number
            </label>
            <input
              className={inputClassName}
              value={slotForm.slotNumber}
              onChange={(event) =>
                onSlotFormChange({
                  ...slotForm,
                  slotNumber: event.target.value,
                })
              }
              placeholder="V-01"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#111111]">
              Status
            </label>
            <select
              className={selectClassName}
              value={slotForm.status}
              onChange={(event) =>
                onSlotFormChange({
                  ...slotForm,
                  status: event.target.value as Exclude<
                    VisitorParkingSlotStatus,
                    "ALL" | "OCCUPIED"
                  >,
                })
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#111111]">
              Notes
            </label>
            <input
              className={inputClassName}
              value={slotForm.notes}
              onChange={(event) =>
                onSlotFormChange({
                  ...slotForm,
                  notes: event.target.value,
                })
              }
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          type="button"
          className={`${primaryButtonClassName} mt-4`}
          disabled={isCreating}
          onClick={onCreateSlot}
        >
          <Plus className="h-4 w-4" />
          {isCreating ? "Creating..." : "Add Slot"}
        </button>
      </div>

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
                  {flatNumberById.get(visitor.flatId) ??
                    visitor.flatId}
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
    </div>
  )
}
