"use client"

import { AlertTriangle, X } from "lucide-react"
import { Portal } from "@/components/portal"
import { useReleaseResidentParkingMutation } from "../hooks/use-parking-queries"
import type { ParkingSlot } from "../types/parking.types"

type ReleaseSlotDialogProps = {
  slot: ParkingSlot | null
  onClose: () => void
}

export function ReleaseSlotDialog({ slot, onClose }: ReleaseSlotDialogProps) {
  const releaseMutation = useReleaseResidentParkingMutation()

  if (!slot) return null

  const handleConfirm = () => {
    releaseMutation.mutate(slot._id, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  return (
    <Portal>
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-slot-title"
      >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl transition-all">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={17} />
            </div>
            <h2 id="release-slot-title" className="text-base font-semibold text-slate-900">
              Release Parking Slot
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={releaseMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to release slot{" "}
            <span className="font-bold text-slate-900 uppercase">
              {slot.slotNumber}
            </span>
            ? The slot will immediately become{" "}
            <span className="font-semibold text-emerald-700">Available</span> for new assignments.
          </p>

          {/* Current Assignment Details */}
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Slot Number:</span>
              <span className="font-bold text-slate-900 uppercase">{slot.slotNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Assigned Flat:</span>
              <span className="font-semibold text-slate-900">
                {slot.flatId ? `Flat ${slot.flatId.flatNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Vehicle Number:</span>
              <span className="font-mono font-bold uppercase text-slate-900">
                {slot.vehicleNumber || "—"}
              </span>
            </div>
            {slot.residentId?.phoneNumber && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Contact:</span>
                <span className="font-medium text-slate-700">{slot.residentId.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={releaseMutation.isPending}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={releaseMutation.isPending}
              className="h-10 rounded-lg bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
            >
              {releaseMutation.isPending ? "Releasing..." : "Yes, Release Slot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
)
}
