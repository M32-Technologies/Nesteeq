"use client"

import { useRef, useState } from "react"
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  IndianRupee,
  Plus,
  Receipt,
  RotateCw,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import {
  submitCost,
  uploadEvidence,
  type SubmitCostResponse,
} from "../services/jobs.service"

export type InitialExpenseInfo = {
  expenseAmount?: number
  expenseDescription?: string
  expenseReceiptUrl?: string | null
  expenseStatus?: "PENDING_FACILITY_APPROVAL" | "APPROVED" | "REJECTED" | string
  expenseSubmittedAt?: string
  expenseRejectionReason?: string
}

type MaintenanceCostFormProps = {
  jobId: string
  initialExpense?: InitialExpenseInfo
  onCostSubmitted?: (cost: SubmitCostResponse) => void
}

export default function MaintenanceCostForm({
  jobId,
  initialExpense,
  onCostSubmitted,
}: MaintenanceCostFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeExpense, setActiveExpense] = useState<InitialExpenseInfo | null>(
    initialExpense && initialExpense.expenseAmount != null
      ? initialExpense
      : null
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Receipt file size cannot exceed 10MB.")
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Please enter a valid positive cost amount.")
      return
    }

    if (!description.trim()) {
      setErrorMessage("Please provide a short description for this expense.")
      return
    }

    try {
      setIsSubmitting(true)

      let receiptUrl: string | null = null
      if (selectedFile) {
        const formData = new FormData()
        formData.append("evidence", selectedFile)
        formData.append("file", selectedFile)
        const uploadRes = await uploadEvidence(jobId, formData)
        receiptUrl = uploadRes.fileUrl
      }

      const res = await submitCost(jobId, {
        amount: numAmount,
        expenseAmount: numAmount,
        description: description.trim(),
        expenseDescription: description.trim(),
        receiptUrl,
        expenseReceiptUrl: receiptUrl,
      })

      const newExpense: InitialExpenseInfo = {
        expenseAmount: numAmount,
        expenseDescription: description.trim(),
        expenseReceiptUrl: receiptUrl,
        expenseStatus: "PENDING_FACILITY_APPROVAL",
        expenseSubmittedAt: res.submittedAt,
      }

      setActiveExpense(newExpense)
      setSuccessMessage(
        `Expense of ₹${numAmount.toFixed(2)} submitted for Facility Manager approval!`
      )
      toast.success(
        `Expense of ₹${numAmount.toFixed(2)} submitted for Facility Manager approval!`
      )

      setAmount("")
      setDescription("")
      handleClearFile()
      onCostSubmitted?.(res)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit maintenance cost."
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
            Approved by Facility
          </span>
        )
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <XCircle size={13} className="shrink-0 text-red-600" />
            Rejected
          </span>
        )
      case "PENDING_FACILITY_APPROVAL":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            <Clock size={13} className="shrink-0 text-amber-600" />
            Pending Facility Approval
          </span>
        )
    }
  }

  return (
    <div id="cost-submission" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Receipt size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Maintenance Cost Submission
            </h3>
            <p className="text-xs text-slate-500">
              Submit spare parts or material costs for facility manager review.
            </p>
          </div>
        </div>

        {activeExpense?.expenseStatus && (
          <div>{renderStatusBadge(activeExpense.expenseStatus)}</div>
        )}
      </div>

      {/* Active Submitted Expense Summary Card */}
      {activeExpense && activeExpense.expenseAmount != null && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Submitted Material Cost
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-slate-900">
                  ₹{Number(activeExpense.expenseAmount).toFixed(2)}
                </span>
              </div>
            </div>
            {renderStatusBadge(activeExpense.expenseStatus)}
          </div>

          {activeExpense.expenseDescription && (
            <p className="text-xs text-slate-700 font-medium">
              {activeExpense.expenseDescription}
            </p>
          )}

          {activeExpense.expenseRejectionReason && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <span className="font-semibold">Rejection Reason:</span>{" "}
              {activeExpense.expenseRejectionReason}
            </div>
          )}

          {activeExpense.expenseReceiptUrl && (
            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Receipt / Bill attached
              </span>
              <a
                href={activeExpense.expenseReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                <span>View Receipt</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Submission Form (available when no expense yet, or when pending/rejected for updating) */}
      {(!activeExpense || activeExpense.expenseStatus !== "APPROVED") && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {activeExpense && activeExpense.expenseStatus === "REJECTED" && (
            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              The previous expense was rejected. You can update and resubmit the material cost below.
            </p>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Expense Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Item / Material Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Replacement 1/2 inch brass pipe connector & sealing tape..."
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          {/* Evidence / Bill Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Bill / Receipt Photo (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 transition hover:border-[#0F5F45] hover:bg-[#0F5F45]/5 hover:text-[#0F5F45]"
              >
                <Camera size={15} />
                <span>Upload Receipt Photo / Bill</span>
              </button>
            ) : (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="h-10 w-10 rounded object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200 text-slate-600 shrink-0">
                      <FileText size={16} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFile}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-red-600"
                  title="Remove file"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !amount || !description.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c4e38] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  {activeExpense ? "Update Cost" : "Submit Cost"}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}