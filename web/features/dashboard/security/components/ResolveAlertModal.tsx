"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2 } from "lucide-react"
import { z } from "zod"

import type { EmergencyAlert } from "../services/alert.service"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import {
  DetailGrid,
  DetailModal,
  StatusBadge,
  formatLabel,
  outlineButtonClassName,
  primaryButtonClassName,
  textareaClassName,
} from "./SecurityUi"

const resolveAlertSchema = z.object({
  resolutionNotes: z
    .string()
    .trim()
    .min(1, "Resolution notes are required")
    .max(500, "Resolution notes cannot exceed 500 characters"),
})

export function ResolveAlertModal({
  alert,
  isSubmitting,
  onClose,
  onResolve,
}: {
  alert: EmergencyAlert | null
  isSubmitting: boolean
  onClose: () => void
  onResolve: (resolutionNotes: string) => Promise<void>
}) {
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [validationError, setValidationError] = useState("")
  const [submitError, setSubmitError] = useState("")

  if (!alert) return null

  const handleClose = () => {
    if (isSubmitting) return

    setResolutionNotes("")
    setValidationError("")
    setSubmitError("")
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError("")

    const result = resolveAlertSchema.safeParse({
      resolutionNotes,
    })

    if (!result.success) {
      setValidationError(
        result.error.issues[0]?.message ??
          "Enter valid resolution notes"
      )
      return
    }

    setValidationError("")

    try {
      await onResolve(result.data.resolutionNotes)
      setResolutionNotes("")
      setSubmitError("")
    } catch (error) {
      setSubmitError(
        getSecurityApiErrorMessage(
          error,
          "Unable to resolve emergency alert."
        )
      )
    }
  }

  return (
    <DetailModal
      title="Resolve Alert"
      subtitle={formatLabel(alert.alertType)}
      onClose={handleClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <DetailGrid
          items={[
            {
              label: "Status",
              value: <StatusBadge status={alert.status} />,
            },
            {
              label: "Resident",
              value: alert.residentName ?? alert.residentId,
            },
            {
              label: "Flat / Unit",
              value: alert.flatNumber ?? alert.flatId,
            },
            {
              label: "Message",
              value: alert.message ?? "-",
            },
          ]}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            Resolution Notes
          </label>
          <textarea
            className={textareaClassName}
            value={resolutionNotes}
            onChange={(event) => {
              setResolutionNotes(event.target.value)
              setValidationError("")
              setSubmitError("")
            }}
            placeholder="Enter the action taken and final status"
            disabled={isSubmitting}
          />
          {validationError ? (
            <p className="mt-2 text-sm text-red-700">
              {validationError}
            </p>
          ) : null}
          {submitError ? (
            <p className="mt-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={outlineButtonClassName}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={primaryButtonClassName}
            disabled={isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Resolving..." : "Resolve Alert"}
          </button>
        </div>
      </form>
    </DetailModal>
  )
}
