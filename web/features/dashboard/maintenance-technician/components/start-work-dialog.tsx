"use client"

import { Play } from "lucide-react"

type StartWorkDialogProps = {
  open: boolean
  jobId: string
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function StartWorkDialog({
  open,
  jobId,
  isLoading,
  onConfirm,
  onClose,
}: StartWorkDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0F5F45]">
            <Play size={18} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Start this maintenance job?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Are you ready to begin work on <span className="font-semibold text-slate-800">{jobId}</span>? The status will transition to <span className="font-semibold text-sky-700">In Progress</span>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c4e38] disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Start Work"}
          </button>
        </div>
      </div>
    </div>
  )
}