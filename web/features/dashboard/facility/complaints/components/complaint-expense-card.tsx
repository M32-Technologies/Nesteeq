"use client"

import { useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  Receipt,
  X,
  XCircle,
} from "lucide-react"

import type { Complaint } from "../types/complaints.types"

type ComplaintExpenseCardProps = {
  complaint: Complaint
  onApproveExpense?: () => void
  onRejectExpense?: (reason?: string) => void
  isApproving?: boolean
  isRejecting?: boolean
}

export function ComplaintExpenseCard({
  complaint,
  onApproveExpense,
  onRejectExpense,
  isApproving = false,
  isRejecting = false,
}: ComplaintExpenseCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  if (complaint.expenseAmount == null) {
    return null
  }

  const status = complaint.expenseStatus || "PENDING_FACILITY_APPROVAL"
  const isApproved = status === "APPROVED"
  const isRejected = status === "REJECTED"
  const isPending = !isApproved && !isRejected

  const handleConfirmReject = () => {
    onRejectExpense?.(rejectionReason.trim() || undefined)
    setShowRejectForm(false)
    setRejectionReason("")
  }

  return (
    <section className="border-b border-[#E8EDF2] py-5">
      <div className="rounded-xl border border-[#E8EDF2] bg-white p-5 shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E8EDF2] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="size-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Expense / Material Cost
              </h3>
              <p className="text-xs text-[#6B7280]">
                Technician cost submission for maintenance materials
              </p>
            </div>
          </div>

          <div>
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Approved
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="size-3.5 text-rose-600" />
                Rejected
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Clock className="size-3.5 text-amber-600" />
                Pending Approval
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {/* Amount and Description */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#E8EDF2]/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Submitted Amount
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#111111]">
                  ₹ {Number(complaint.expenseAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#E8EDF2]/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Material / Item Description
              </span>
              <p className="mt-1 text-sm font-medium text-[#111111] leading-snug">
                {complaint.expenseDescription || "No description provided"}
              </p>
            </div>
          </div>

          {/* Rejection Reason Display (if rejected) */}
          {complaint.expenseRejectionReason && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-semibold">Rejection Reason:</span>{" "}
                {complaint.expenseRejectionReason}
              </div>
            </div>
          )}

          {/* Attached Receipt Preview */}
          {complaint.expenseReceiptUrl && (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Attached Receipt / Bill
              </span>
              <div className="mt-2 flex items-center gap-3">
                <div
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="group relative flex h-20 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#E8EDF2] bg-[#F8FAFC] transition hover:border-[#07584F]"
                >
                  <img
                    src={complaint.expenseReceiptUrl}
                    alt="Expense receipt"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Eye className="size-5 text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#07584F] hover:underline"
                  >
                    <Eye className="size-3.5" />
                    <span>View full size</span>
                  </button>
                  <p className="text-[11px] text-[#6B7280]">
                    Click to inspect invoice / bill document
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inline Rejection Form */}
          {showRejectForm && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3.5 space-y-3">
              <label className="block text-xs font-semibold text-rose-900">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt amount mismatch, non-essential part, exceeds allowance..."
                className="w-full resize-none rounded-lg border border-rose-200 bg-white p-2.5 text-xs text-[#111111] outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectionReason("")
                  }}
                  className="rounded-lg border border-[#E8EDF2] bg-white px-3 py-1.5 text-xs font-medium text-[#4E5B67] hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={handleConfirmReject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="size-3.5" />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for Facility Manager */}
          {!showRejectForm && (
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#E8EDF2]">
              {isApproved ? (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  This maintenance expense has been approved.
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isApproving || isRejecting}
                    onClick={() => setShowRejectForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50 hover:border-rose-300 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="size-3.5" />
                    Reject Expense
                  </button>

                  <button
                    type="button"
                    disabled={isApproving || isRejecting}
                    onClick={onApproveExpense}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064e46] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        Approve Expense
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Size Receipt Modal */}
      {isReceiptModalOpen && complaint.expenseReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8EDF2] px-4 py-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-[#07584F]" />
                <span className="text-sm font-semibold text-[#111111]">
                  Receipt Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={complaint.expenseReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#07584F] hover:bg-slate-100 transition"
                >
                  <span>Open Original</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-60px)] overflow-auto p-4 flex items-center justify-center bg-slate-50">
              <img
                src={complaint.expenseReceiptUrl}
                alt="Receipt document"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
