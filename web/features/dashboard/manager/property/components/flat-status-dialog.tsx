"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"

import { useUpdatePropertyFlatStatusMutation } from "../hooks/use-property-query"
import type { PropertyFlat, PropertyFlatStatus } from "../types/property"

type FlatStatusDialogProps = {
  flat: PropertyFlat | null
  status: PropertyFlatStatus | null
  onClose: () => void
}

export default function FlatStatusDialog({
  flat,
  status,
  onClose,
}: FlatStatusDialogProps) {
  const updateStatus = useUpdatePropertyFlatStatusMutation()
  const [formError, setFormError] = useState("")
  const open = Boolean(flat && status)

  if (!open || !flat || !status) {
    return null
  }

  const isActivating = status === "active"
  const actionLabel = isActivating ? "Reactivate" : "Deactivate"

  const closeDialog = () => {
    if (updateStatus.isPending) return

    setFormError("")
    onClose()
  }

  const submitStatusChange = async () => {
    try {
      setFormError("")
      await updateStatus.mutateAsync({
        flatId: flat.id,
        input: { status },
      })
      toast.success(
        isActivating
          ? "Flat reactivated successfully"
          : "Flat deactivated successfully"
      )
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update flat status"

      toast.error(message)
      setFormError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 sm:items-center">
      <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[82px] items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              {actionLabel} Flat?
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              {isActivating
                ? "This flat will move back to active flats."
                : "This action does not permanently delete the flat."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={updateStatus.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Close ${actionLabel.toLowerCase()} flat dialog`}
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <div
            className={`flex gap-3 rounded-lg px-4 py-3 ${
              isActivating
                ? "border border-emerald-100 bg-emerald-50"
                : "border border-red-100 bg-red-50"
            }`}
          >
            {isActivating ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
            ) : (
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}
            <div>
              <p
                className={`text-sm font-semibold ${
                  isActivating ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {flat.flatNumber} will be marked as {status}.
              </p>
              <p
                className={`mt-1 text-xs font-medium leading-5 ${
                  isActivating ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {isActivating
                  ? "The flat will appear again in active flat workflows."
                  : "The flat stays in records, but active workflows should no longer use it."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={closeDialog}
            disabled={updateStatus.isPending}
            className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitStatusChange}
            disabled={updateStatus.isPending}
            className={`flex h-11 items-center justify-center rounded-lg text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
              isActivating
                ? "bg-[#0F5F45] hover:bg-[#0B4D38]"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {updateStatus.isPending
              ? isActivating
                ? "Activating..."
                : "Deactivating..."
              : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
