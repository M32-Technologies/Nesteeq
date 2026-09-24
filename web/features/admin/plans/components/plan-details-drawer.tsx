"use client"

import { useEffect, useState } from "react"
import {
  X,
  CreditCard,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Check,
  Copy,
  CheckCheck,
  Edit3,
  Power,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan } from "../types"

type PlanDetailsDrawerProps = {
  plan: SubscriptionPlan | null
  isOpen: boolean
  onClose: () => void
  onEdit: (plan: SubscriptionPlan) => void
  onToggleStatus: (plan: SubscriptionPlan, newStatus: boolean) => Promise<void>
}

export default function PlanDetailsDrawer({
  plan,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}: PlanDetailsDrawerProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !plan) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleToggle = async () => {
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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const monthlyRate =
    plan.durationMonths > 0
      ? Math.round(plan.price / plan.durationMonths)
      : plan.price

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-100">
                  <CreditCard className="h-5 w-5 stroke-[1.8]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] leading-tight">
                    {plan.planName}
                  </h2>
                  <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize font-medium text-[#07584F]">
                      {plan.planType.replace(/_/g, " ")} tier
                    </span>
                    <span>•</span>
                    <span>
                      {plan.durationMonths}{" "}
                      {plan.durationMonths === 1 ? "month" : "months"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Status & Pricing Banner */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    Full Subscription Fee
                  </span>
                  <div className="text-2xl font-bold text-[#0F172A] mt-0.5">
                    {formatPrice(plan.price)}
                  </div>
                  {plan.durationMonths > 1 && (
                    <span className="text-xs text-[#64748B]">
                      ≈ {formatPrice(monthlyRate)} / month
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      plan.isActive
                        ? "bg-[#EAF5EE] text-[#07584F] border border-emerald-200"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {plan.isActive ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 text-[#07584F]" />
                        Active on Platform
                      </>
                    ) : (
                      "Inactive / Hidden"
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isToggling}
                    className="text-[11px] font-semibold text-[#07584F] hover:underline inline-flex items-center gap-1"
                  >
                    {isToggling ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                    {plan.isActive ? "Switch to Inactive" : "Activate Plan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Offerings */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#0F172A]">
                      Free Trial Policy
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      {plan.freeTrial?.enabled
                        ? `${plan.freeTrial.days}-day trial period before billing`
                        : "No free trial configured for this tier"}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    plan.freeTrial?.enabled
                      ? "bg-amber-100/70 text-amber-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {plan.freeTrial?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Razorpay Gateway Linkage */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Payment Gateway Configuration
              </span>

              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200/60">
                <div className="overflow-hidden">
                  <p className="text-[10px] text-[#64748B]">Razorpay Plan ID</p>
                  <p className="truncate font-mono text-xs font-semibold text-[#0F172A]">
                    {plan.razorpayPlanId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(plan.razorpayPlanId)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition-colors shrink-0"
                  title="Copy Razorpay Plan ID"
                >
                  {copiedId ? (
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Feature Set */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Feature Checklist ({plan.features?.length || 0})
                </span>
              </div>

              {plan.features && plan.features.length > 0 ? (
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 text-xs text-[#334155] py-1 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF5EE] text-[#07584F]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] italic">
                  No explicit features configured.
                </p>
              )}
            </div>

            {/* Metadata & Audit */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Plan Metadata
              </span>
              <div className="flex justify-between text-[#64748B]">
                <span>System Plan ID</span>
                <span className="font-mono text-[11px] text-[#0F172A]">
                  {plan._id}
                </span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Plan Type Slug</span>
                <span className="font-medium text-[#0F172A]">{plan.planType}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Created At</span>
                <span className="font-medium text-[#0F172A]">
                  {formatDate(plan.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Last Updated</span>
                <span className="font-medium text-[#0F172A]">
                  {formatDate(plan.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(plan)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition-all hover:shadow-[0_4px_12px_rgba(7,88,79,0.2)]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit This Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
