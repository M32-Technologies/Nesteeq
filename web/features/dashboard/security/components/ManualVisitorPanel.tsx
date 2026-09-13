"use client"

import { UserPlus } from "lucide-react"

import {
  getParkingVehicleTypeLabel,
  matchesParkingVehicleType,
  parkingVehicleTypeOptions,
} from "../constants/parking-vehicle-types"
import type { VisitorParkingSlot } from "../schemas/parking"
import type { SecurityFlat } from "../schemas/security"
import {
  inputClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
} from "./SecurityUi"

export interface ManualVisitorFormState {
  flatId: string
  visitorName: string
  visitorPhone: string
  purpose: string
  vehicleNumber: string
  vehicleType: string
  parkingSlotId: string
}

export function ManualVisitorPanel({
  flats,
  flatsLoading,
  form,
  availableSlots,
  availableSlotsLoading,
  isSubmitting,
  onFormChange,
  onSubmit,
}: {
  flats: SecurityFlat[]
  flatsLoading: boolean
  form: ManualVisitorFormState
  availableSlots: VisitorParkingSlot[]
  availableSlotsLoading: boolean
  isSubmitting: boolean
  onFormChange: (form: ManualVisitorFormState) => void
  onSubmit: () => void
}) {
  const filteredAvailableSlots = availableSlots.filter((slot) =>
    matchesParkingVehicleType(slot.vehicleType, form.vehicleType)
  )
  const parkingSlotPlaceholder = (() => {
    if (availableSlotsLoading) return "Loading slots..."
    if (form.vehicleType) {
      return `Select ${getParkingVehicleTypeLabel(form.vehicleType)} slot`
    }

    return "Select vehicle type first"
  })()

  return (
    <div className={panelClassName}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Flat / Unit
          </label>
          <select
            className={selectClassName}
            value={form.flatId}
            onChange={(event) =>
              onFormChange({
                ...form,
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
            Visitor Name
          </label>
          <input
            type="text"
            className={inputClassName}
            value={form.visitorName}
            onChange={(event) =>
              onFormChange({
                ...form,
                visitorName: event.target.value,
              })
            }
            placeholder="Visitor name"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Visitor Phone
          </label>
          <input
            type="tel"
            className={inputClassName}
            value={form.visitorPhone}
            onChange={(event) =>
              onFormChange({
                ...form,
                visitorPhone: event.target.value,
              })
            }
            placeholder="Phone"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Purpose
          </label>
          <input
            type="text"
            className={inputClassName}
            value={form.purpose}
            onChange={(event) =>
              onFormChange({
                ...form,
                purpose: event.target.value,
              })
            }
            placeholder="Purpose"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Vehicle Number
          </label>
          <input
            type="text"
            className={inputClassName}
            value={form.vehicleNumber}
            onChange={(event) =>
              onFormChange({
                ...form,
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
          <select
            className={selectClassName}
            value={form.vehicleType}
            onChange={(event) =>
              onFormChange({
                ...form,
                vehicleType: event.target.value,
                parkingSlotId: "",
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
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Parking Slot
          </label>
          <select
            className={selectClassName}
            value={form.parkingSlotId}
            onChange={(event) =>
              onFormChange({
                ...form,
                parkingSlotId: event.target.value,
              })
            }
            disabled={availableSlotsLoading || !form.vehicleType}
          >
            <option value="">{parkingSlotPlaceholder}</option>
            {filteredAvailableSlots.map((slot) => (
              <option key={slot._id} value={slot._id}>
                {slot.slotNumber}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? "Registering..." : "Register & Check In"}
      </button>
    </div>
  )
}
