"use client"

import { useState } from "react"
import { CheckCircle2, Clock, History, Send } from "lucide-react"

export type TimelineItem = {
  id: string
  message: string
  createdAt: string
  author: string
}

type WorkProgressSectionProps = {
  jobId: string
  updates: TimelineItem[]
  onAddUpdate: (message: string) => Promise<void>
  isSubmitting: boolean
  formatDate: (dateString?: string) => string
  isReadOnly?: boolean
}

export default function WorkProgressSection({
  jobId,
  updates,
  onAddUpdate,
  isSubmitting,
  formatDate,
  isReadOnly = false,
}: WorkProgressSectionProps) {
  const [input, setInput] = useState("")

  const handleSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSubmitting) return
    await onAddUpdate(trimmed)
    setInput("")
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <History size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Work Progress & Timeline
            </h3>
            <p className="text-xs text-slate-500">
              {isReadOnly
                ? "Historical maintenance work log and event timeline (Read-Only)."
                : "Record real-time progress updates and track chronological maintenance work history."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500">
              Read-Only
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
            {updates.length} update{updates.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      {/* Add Progress Update Form (hidden in read-only mode) */}
      {!isReadOnly && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Post a New Progress Update
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Inspected the bathroom valve. Replaced damaged connector and currently testing water pressure..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSubmitting || !input.trim()}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c4e38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={13} />
              {isSubmitting ? "Posting..." : "Add Update"}
            </button>
          </div>
        </div>
      )}

      {/* Chronological Timeline */}
      <div className="space-y-4 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Activity Timeline
        </p>

        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
            <Clock size={24} className="text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No progress updates yet
            </p>
            <p className="text-xs text-slate-400">
              {isReadOnly
                ? "No progress updates recorded for this job."
                : "Start work and add progress notes above to track real-time activity."}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-slate-200">
            {updates.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                <div className="absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E7F4EE] text-[#0F5F45] shadow-sm">
                  <CheckCircle2 size={12} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-800">
                      {item.author || "You (Technician)"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}