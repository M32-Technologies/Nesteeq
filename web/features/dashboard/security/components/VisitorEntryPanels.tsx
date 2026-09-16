"use client"

import { QrCode, UserPlus } from "lucide-react"

import { outlineButtonClassName, primaryButtonClassName } from "./SecurityUi"

export { ManualVisitorPanel } from "./ManualVisitorPanel"
export type { ManualVisitorFormState } from "./ManualVisitorPanel"
export { VisitorScanPanel } from "./VisitorScanPanel"

export type VisitorEntryMode = "scan" | "manual"

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
