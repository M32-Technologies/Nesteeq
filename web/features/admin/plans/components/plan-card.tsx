"use client"

import { useState } from "react"
import {
  Check,
  Copy,
  CheckCheck,
  Sparkles,
  Edit3,
  Eye,
  Power,
  Layers,
  Clock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan } from "../types"

type PlanCardProps = {
  plan: SubscriptionPlan
  onViewDetails: (plan: SubscriptionPlan) => void
  onEdit: (plan: SubscriptionPlan) => void
  onToggleStatus: (plan: SubscriptionPlan, newStatus: boolean) => Promise<void>
}

export default function PlanCard({
  plan,
  onViewDetails,
  onEdit,
  onToggleStatus,
}: PlanCardProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleCopyRazorpayId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!plan.razorpayPlanId) return
    navigator.clipboard.writeText(plan.razorpayPlanId)
    setCopiedId(true)
    toast.success("Razorpay Plan ID copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setIsToggling(true)
      await onToggleStatus(plan, !plan.isActive)
    } finally {
      setIsToggling(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-md ${
        plan.isActive
          ? "border-slate-200/80 hover:border-slate-300"
          : "border-slate-200/50 bg-slate-50/40 opacity-80"
      }`}
    >
      <div>
        {/* Top Badges & Status Switch */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF5EE] border border-emerald-200/70 px-2.5 py-1 text-xs font-semibold text-[#07584F] capitalize max-w-[180px]"
              title={plan.planType}
            >
              <Layers className="h-3 w-3 shrink-0" />
              <span className="truncate">{plan.planType.replace(/_/g, " ")}</span>
            </span>

            {plan.freeTrial?.enabled && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {plan.freeTrial.days}d Trial
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            title={plan.isActive ? "Deactivate plan" : "Activate plan"}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              plan.isActive
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {isToggling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Power className="h-3 w-3" />
            )}
            <span>{plan.isActive ? "Active" : "Inactive"}</span>
          </button>
        </div>

        {/* Title & Pricing */}
        <div className="mt-4">
          <h3 className="text-lg font-bold tracking-tight text-[#0F172A]">
            {plan.planName}
          </h3>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
              {formatPrice(plan.price)}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              / {plan.durationMonths}{" "}
              {plan.durationMonths === 1 ? "month" : "months"}
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            Included capabilities
          </p>

          {plan.features && plan.features.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {plan.features.slice(0, 5).map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-[#334155]"
                >
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF5EE] text-[#07584F]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}

              {plan.features.length > 5 && (
                <li className="text-[11px] font-medium text-[#07584F] pl-6 pt-0.5">
                  +{plan.features.length - 5} more features
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#94A3B8] italic">
              Standard core platform features
            </p>
          )}
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        {/* Razorpay identifier */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60 mb-3.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
              Gateway ID
            </span>
            <span className="truncate font-mono text-xs text-[#0F172A]">
              {plan.razorpayPlanId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyRazorpayId}
            className="ml-2 shrink-0 rounded p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60 transition-colors"
            title="Copy Razorpay Plan ID"
          >
            {copiedId ? (
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(plan)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-[#64748B]" />
            Details
          </button>

          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#07584F] px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition-all hover:shadow-[0_4px_12px_rgba(7,88,79,0.2)]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Plan
          </button>
        </div>
      </div>
    </div>
  )
}
