"use client"

import { useState } from "react"
import { CheckCircle2, DollarSign, IndianRupee, Plus, Receipt } from "lucide-react"

import {
  submitCost,
  type SubmitCostResponse,
} from "../services/jobs.service"

type MaintenanceCostFormProps = {
  jobId: string
  onCostSubmitted?: (cost: SubmitCostResponse) => void
}

export default function MaintenanceCostForm({
  jobId,
  onCostSubmitted,
}: MaintenanceCostFormProps) {
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submittedCosts, setSubmittedCosts] = useState<SubmitCostResponse[]>([])

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
      const res = await submitCost(jobId, {
        amount: numAmount,
        description: description.trim(),
      })

      setSubmittedCosts((prev) => [res, ...prev])
      setSuccessMessage(
        `Cost of ₹${res.amount.toFixed(2)} submitted for approval!`
      )
      setAmount("")
      setDescription("")
      onCostSubmitted?.(res)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to submit maintenance cost."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalCosts = submittedCosts.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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
              Submit spare parts or material costs for manager approval.
            </p>
          </div>
        </div>

        {totalCosts > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            Total: ₹{totalCosts.toFixed(2)}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Expense Amount (₹)
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
            Item / Material Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Replacement 1/2 inch brass pipe connector & sealing tape..."
            className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
          />
        </div>

        {errorMessage && (
          <p className="text-xs font-medium text-red-600">{errorMessage}</p>
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
            <Plus size={14} />
            {isSubmitting ? "Submitting..." : "Submit Cost"}
          </button>
        </div>
      </form>

      {/* Submitted costs list */}
      {submittedCosts.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Costs Submitted This Session ({submittedCosts.length})
          </p>
          <div className="space-y-2">
            {submittedCosts.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-slate-900 truncate">
                    {c.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Awaiting manager approval
                  </p>
                </div>
                <span className="font-semibold text-[#0F5F45] shrink-0">
                  ₹{c.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}