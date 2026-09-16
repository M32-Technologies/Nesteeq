"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"

type CompleteWorkDialogProps = {
  open: boolean
  jobId: string
  isLoading: boolean
  onConfirm: (payload: { workSummary: string; notes?: string }) => Promise<void> | void
  onClose: () => void
}

export default function CompleteWorkDialog({
  open,
  jobId,
  isLoading,
  onConfirm,
  onClose,
}: CompleteWorkDialogProps) {
  const [workSummary, setWorkSummary] = useState("")
  const [notes, setNotes] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSummary = workSummary.trim()
    if (!trimmedSummary) {
      setValidationError("Work summary is required before marking this job as completed.")
      return
    }

    setValidationError(null)
    onConfirm({
      workSummary: trimmedSummary,
      notes: notes.trim() || undefined,
    })
  }

  const handleClose = () => {
    if (isLoading) return
    setValidationError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0F5F45]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Complete Maintenance Work
              </h3>
              <p className="text-xs text-slate-500">
                Finalize and mark job <span className="font-semibold text-slate-800">{jobId}</span> as completed
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Mandatory Work Summary */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
              <span>
                Work Summary <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400 lowercase">
                mandatory
              </span>
            </label>
            <textarea
              value={workSummary}
              onChange={(e) => {
                setWorkSummary(e.target.value)
                if (validationError && e.target.value.trim()) {
                  setValidationError(null)
                }
              }}
              rows={4}
              placeholder="Detail the work carried out (e.g., replaced leaking faucet cartridge, resealed joints with PTFE tape, tested water flow with zero leaks observed)..."
              disabled={isLoading}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:bg-slate-50"
            />
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Additional Notes <span className="font-normal text-slate-400 lowercase">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any recommendations for the resident or facility team (e.g., recommend checking main pressure regulator next quarter)..."
              disabled={isLoading}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:bg-slate-50"
            />
          </div>

          <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-800">
            Once submitted, this job status will be marked as <strong>Completed</strong> and the job record will transition to read-only mode.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !workSummary.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c4e38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Marking Completed...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Mark Completed
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

