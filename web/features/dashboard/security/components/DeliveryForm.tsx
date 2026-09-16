"use client"

import { Package } from "lucide-react"

import type { DeliveryType } from "../schemas/delivery"
import type { SecurityFlat } from "../schemas/security"
import {
  inputClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
} from "./SecurityUi"

export interface DeliveryFormState {
  deliveryType: DeliveryType
  flatId: string
  deliveryCompany: string
  deliveryPersonName: string
  deliveryPersonPhone: string
  packageDescription: string
}

const deliveryTypes: Array<{
  label: string
  value: DeliveryType
}> = [
  { label: "Parcel", value: "PARCEL" },
  { label: "Food", value: "FOOD" },
  { label: "Grocery", value: "GROCERY" },
  { label: "Courier", value: "COURIER" },
  { label: "Other", value: "OTHER" },
]

export function DeliveryForm({
  flats,
  flatsLoading,
  form,
  isSubmitting,
  onFormChange,
  onSubmit,
}: {
  flats: SecurityFlat[]
  flatsLoading: boolean
  form: DeliveryFormState
  isSubmitting: boolean
  onFormChange: (form: DeliveryFormState) => void
  onSubmit: () => void
}) {
  return (
    <div className={panelClassName}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Delivery Type
          </label>
          <select
            className={selectClassName}
            value={form.deliveryType}
            onChange={(event) =>
              onFormChange({
                ...form,
                deliveryType: event.target.value as DeliveryType,
              })
            }
          >
            {deliveryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

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
            Delivery Company / Partner
          </label>
          <input
            className={inputClassName}
            value={form.deliveryCompany}
            onChange={(event) =>
              onFormChange({
                ...form,
                deliveryCompany: event.target.value,
              })
            }
            placeholder="Company or partner"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Delivery Person Name
          </label>
          <input
            className={inputClassName}
            value={form.deliveryPersonName}
            onChange={(event) =>
              onFormChange({
                ...form,
                deliveryPersonName: event.target.value,
              })
            }
            placeholder="Name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Delivery Person Phone (Optional)
          </label>
          <input
            className={inputClassName}
            value={form.deliveryPersonPhone}
            onChange={(event) =>
              onFormChange({
                ...form,
                deliveryPersonPhone: event.target.value,
              })
            }
            placeholder="Optional phone"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Package Description
          </label>
          <input
            className={inputClassName}
            value={form.packageDescription}
            onChange={(event) =>
              onFormChange({
                ...form,
                packageDescription: event.target.value,
              })
            }
            placeholder="Optional description"
          />
        </div>
      </div>

      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        <Package className="h-4 w-4" />
        {isSubmitting ? "Recording..." : "Record Delivery"}
      </button>
    </div>
  )
}
