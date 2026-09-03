"use client"

import { LogIn, QrCode, UserPlus } from "lucide-react"

import type { SecurityFlat } from "../services/security.interface"
import type { VisitorPass } from "../services/visitor.service"
import {
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  primaryButtonClassName,
  selectClassName,
} from "./SecurityUi"

export type VisitorEntryMode = "scan" | "manual"

export interface ManualVisitorFormState {
  flatId: string
  visitorName: string
  visitorPhone: string
  purpose: string
  vehicleNumber: string
}

export function VisitorEntryModeButtons({
  mode,
  onModeChange,
}: {
  mode: VisitorEntryMode
  onModeChange: (mode: VisitorEntryMode) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={
          mode === "scan"
            ? primaryButtonClassName
            : outlineButtonClassName
        }
        onClick={() => onModeChange("scan")}
      >
        <QrCode className="h-4 w-4" />
        Scan Visitor QR
      </button>

      <button
        type="button"
        className={
          mode === "manual"
            ? primaryButtonClassName
            : outlineButtonClassName
        }
        onClick={() => onModeChange("manual")}
      >
        <UserPlus className="h-4 w-4" />
        Register Manually
      </button>
    </div>
  )
}

export function VisitorScanPanel({
  token,
  verifiedPass,
  isCheckingIn,
  isVerifying,
  onCheckIn,
  onTokenChange,
  onVerify,
}: {
  token: string
  verifiedPass: VisitorPass | null
  isCheckingIn: boolean
  isVerifying: boolean
  onCheckIn: () => void
  onTokenChange: (value: string) => void
  onVerify: () => void
}) {
  return (
    <div className={panelClassName}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Visitor Pass Token
          </label>

          <input
            type="text"
            className={inputClassName}
            value={token}
            onChange={(event) =>
              onTokenChange(event.target.value)
            }
            placeholder="Scan QR or enter token"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className={primaryButtonClassName}
            onClick={onVerify}
            disabled={isVerifying}
          >
            <QrCode className="h-4 w-4" />
            {isVerifying ? "Verifying..." : "Verify Pass"}
          </button>
        </div>
      </div>

      {verifiedPass ? (
        <div className="mt-5 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Visitor
              </p>
              <p className="mt-1 font-medium text-[#111111]">
                {verifiedPass.visitorName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Phone
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.visitorPhone || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Purpose
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.purpose || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Vehicle
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.vehicleNumber || "-"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`${primaryButtonClassName} mt-4`}
            onClick={onCheckIn}
            disabled={isCheckingIn}
          >
            <LogIn className="h-4 w-4" />
            {isCheckingIn ? "Checking in..." : "Confirm Check-In"}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ManualVisitorPanel({
  flats,
  flatsLoading,
  form,
  isSubmitting,
  onFormChange,
  onSubmit,
}: {
  flats: SecurityFlat[]
  flatsLoading: boolean
  form: ManualVisitorFormState
  isSubmitting: boolean
  onFormChange: (form: ManualVisitorFormState) => void
  onSubmit: () => void
}) {
  return (
    <div className={panelClassName}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
