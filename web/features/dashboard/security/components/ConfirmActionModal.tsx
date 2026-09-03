"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import { getSecurityApiErrorMessage } from "../utils/api-error"
import {
  DetailModal,
  dangerButtonClassName,
  outlineButtonClassName,
  primaryButtonClassName,
} from "./SecurityUi"

export function ConfirmActionModal({
  actionLabel,
  isOpen,
  isSubmitting,
  message,
  onClose,
  onConfirm,
  title,
  variant = "primary",
}: {
  actionLabel: string
  isOpen: boolean
  isSubmitting: boolean
  message: string
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  variant?: "primary" | "danger"
}) {
  const [submitError, setSubmitError] =
    useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const isBusy = isSubmitting || isConfirming

  if (!isOpen) return null

  const handleClose = () => {
    if (isBusy) return

    setSubmitError(null)
    setIsConfirming(false)
    onClose()
  }

  const handleConfirm = async () => {
    if (isBusy) return

    setSubmitError(null)
    setIsConfirming(true)

    try {
      await onConfirm()
    } catch (error) {
      setSubmitError(
        getSecurityApiErrorMessage(
          error,
          "Unable to complete this action."
        )
      )
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <DetailModal title={title} onClose={handleClose}>
      <div className="flex gap-3">
        <span className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </span>

        <div>
          <p className="text-sm text-[#111111]">{message}</p>

          {submitError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className={outlineButtonClassName}
          disabled={isBusy}
          onClick={handleClose}
        >
          Cancel
        </button>

        <button
          type="button"
          className={
            variant === "danger"
              ? dangerButtonClassName
              : primaryButtonClassName
          }
          disabled={isBusy}
          onClick={handleConfirm}
        >
          {isBusy ? "Working..." : actionLabel}
        </button>
      </div>
    </DetailModal>
  )
}
