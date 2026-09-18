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
  residentId?: string
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
  const selectedFlat = flats.find((f) => f._id === form.flatId)
  const primaryResident = selectedFlat?.residents?.[0]

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
            onChange={(event) => {
              const nextFlatId = event.target.value
              const flat = flats.find((f) => f._id === nextFlatId)
              onFormChange({
                ...form,
                flatId: nextFlatId,
                residentId: flat?.residents?.[0]?._id || "",
              })
            }}
            disabled={flatsLoading}
          >
            <option value="">
              {flatsLoading ? "Loading flats..." : "Select flat"}
            </option>
            {flats.map((flat) => {
              const resName = flat.residents?.[0]?.name
              return (
                <option key={flat._id} value={flat._id}>
                  {flat.flatNumber} {resName ? `• ${resName}` : ""}
                </option>
              )
            })}
          </select>
          {primaryResident && (
            <p className="mt-1.5 text-xs text-slate-600">
              Resident: <span className="font-semibold text-slate-900">{primaryResident.name}</span>
              {primaryResident.phone && (
                <span className="text-slate-500"> ({primaryResident.phone})</span>
              )}
            </p>
          )}
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
            placeholder="e.g. Amazon, Swiggy, Ekart"
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

        <div className="md:col-span-2">
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
            placeholder="e.g. Cardboard box, Document envelope"
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
