"use client"

import { useState, useEffect } from "react"
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { format, isValid } from "date-fns"
import { fetchSingleSubscription } from "../api/subscription.api"
import type { SubscriptionItem, SubscriptionStatus } from "../types"
import { cn } from "@/lib/utils"

type SubscriptionDetailsDrawerProps = {
  subscriptionId: string | null
  initialSubscription?: SubscriptionItem | null
  isOpen: boolean
  onClose: () => void
}

function formatINR(amount?: number, currency = "INR"): string {
  if (typeof amount !== "number" || isNaN(amount)) return "—"
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

function formatDate(date?: string | Date | null): string {
  if (!date) return "—"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (!isValid(d)) return "—"
    return format(d, "dd MMM yyyy")
  } catch {
    return "—"
  }
}

function formatDateTime(date?: string | Date | null): string {
  if (!date) return "—"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (!isValid(d)) return "—"
    return format(d, "dd MMM yyyy, hh:mm a")
  } catch {
    return "—"
  }
}

export function renderSubscriptionStatusBadge(status?: SubscriptionStatus | string) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5EE] border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-[#07584F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#07584F]" />
          <span>Active</span>
        </span>
      )
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
          <span>Pending</span>
        </span>
      )
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF2F2] border border-red-200/80 px-2.5 py-0.5 text-xs font-semibold text-[#DC2626]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
          <span>Cancelled</span>
        </span>
      )
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>Expired</span>
        </span>
      )
    case "halted":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F2] border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-[#E11D48]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E11D48]" />
          <span>Halted</span>
        </span>
      )
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
          <span>Completed</span>
        </span>
      )
    case "authenticated":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
          <span>Authenticated</span>
        </span>
      )
    case "created":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>Created</span>
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>{status || "Unknown"}</span>
        </span>
      )
  }
}

export default function SubscriptionDetailsDrawer({
  subscriptionId,
  initialSubscription,
  isOpen,
  onClose,
}: SubscriptionDetailsDrawerProps) {
  const [subscription, setSubscription] = useState<SubscriptionItem | null>(
    initialSubscription || null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

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

  // Load details from backend when opened
  useEffect(() => {
    if (!isOpen || !subscriptionId) return

    let isMounted = true
    async function fetchDetails() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchSingleSubscription(subscriptionId!)
        if (isMounted) {
          setSubscription(data)
        }
      } catch {
        if (isMounted) {
          setError("Failed to load subscription details.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchDetails()
    return () => {
      isMounted = false
    }
  }, [isOpen, subscriptionId])

  if (!isOpen) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const sub = subscription || initialSubscription

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg transform bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-200 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-200/80 shadow-2xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Subscription Details
                </h2>
                <p className="text-xs text-[#64748B]">
                  Overview & lifecycle monitoring
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && !sub ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#07584F]" />
                <p className="text-xs font-medium text-slate-500">Loading subscription details...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-red-900">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 text-xs text-red-700 underline font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : sub ? (
              <>
                {/* 1. Status & Amount Overview Banner */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-[#64748B] block">
                      Subscription Plan
                    </span>
                    <span className="text-lg font-bold text-[#0F172A]">
                      {sub.planSnapshot?.planName || "—"}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      {sub.planSnapshot?.durationMonths
                        ? `${sub.planSnapshot.durationMonths} Month${sub.planSnapshot.durationMonths > 1 ? "s" : ""} Duration`
                        : sub.planSnapshot?.planType || ""}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    {renderSubscriptionStatusBadge(sub.status)}
                    <span className="text-xl font-bold text-[#07584F] tabular-nums">
                      {formatINR(sub.planSnapshot?.price, sub.planSnapshot?.currency)}
                    </span>
                  </div>
                </div>

                {/* 2. Apartment Community */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <Building2 className="h-4 w-4 text-[#07584F]" />
                    <span>Apartment / Community</span>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">
                        {sub.apartment?.name || "Apartment"}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {sub.apartment?.city || "—"}
                        {sub.apartment?.state ? `, ${sub.apartment.state}` : ""}
                      </p>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Society ID: {sub.apartment?._id ? sub.apartment._id.slice(-6) : "—"}
                    </span>
                  </div>
                </div>

                {/* 3. Dates & Lifecycle Information */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <Calendar className="h-4 w-4 text-[#07584F]" />
                    <span>Billing & Renewal Dates</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50/70 p-3 rounded-xl">
                      <span className="text-[11px] text-[#64748B] block font-medium">
                        Start Date
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] mt-1 block">
                        {formatDate(sub.currentStart || sub.startAt || sub.createdAt)}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl">
                      <span className="text-[11px] text-[#64748B] block font-medium">
                        Next Renewal / End
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] mt-1 block">
                        {formatDate(sub.chargeAt || sub.currentEnd || sub.endAt)}
                      </span>
                    </div>

                    {sub.currentStart && (
                      <div className="bg-slate-50/70 p-3 rounded-xl">
                        <span className="text-[11px] text-[#64748B] block font-medium">
                          Cycle Start
                        </span>
                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                          {formatDateTime(sub.currentStart)}
                        </span>
                      </div>
                    )}

                    {sub.currentEnd && (
                      <div className="bg-slate-50/70 p-3 rounded-xl">
                        <span className="text-[11px] text-[#64748B] block font-medium">
                          Cycle End
                        </span>
                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                          {formatDateTime(sub.currentEnd)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Trial Information (Only if applicable) */}
                {sub.isTrial && (
                  <div className="rounded-2xl border border-emerald-200 bg-[#EAF5EE]/40 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#07584F]">
                      <Sparkles className="h-4 w-4 text-[#07584F]" />
                      <span>Free Trial Active</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      This subscription is currently in a free trial period.
                    </p>
                    {sub.trialEndsAt && (
                      <div className="text-xs font-medium text-[#07584F]">
                        Trial ends on: <span className="font-bold">{formatDate(sub.trialEndsAt)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Cancellation Information (Only when actually present) */}
                {(sub.cancelledAt || sub.cancelReason || sub.cancelAtCycleEnd) && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Cancellation Information</span>
                    </div>

                    {sub.cancelledAt && (
                      <div className="text-xs text-slate-700 flex justify-between">
                        <span className="text-slate-500">Cancelled At:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(sub.cancelledAt)}
                        </span>
                      </div>
                    )}

                    {sub.cancelAtCycleEnd && (
                      <div className="text-xs text-slate-700 flex justify-between">
                        <span className="text-slate-500">Cancellation Timing:</span>
                        <span className="font-semibold text-amber-700">
                          Active until cycle end
                        </span>
                      </div>
                    )}

                    {sub.cancelReason && (
                      <div className="text-xs text-slate-700 pt-1 border-t border-red-100">
                        <span className="text-slate-500 block mb-0.5">Reason:</span>
                        <p className="font-medium text-slate-800 italic">
                          &ldquo;{sub.cancelReason}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Razorpay Reference (Only razorpaySubscriptionId, no internal secret tokens) */}
                {sub.razorpaySubscriptionId && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                      <ShieldCheck className="h-4 w-4 text-[#07584F]" />
                      <span>Payment Gateway Reference</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3.5 py-2.5 font-mono text-xs text-[#0F172A]">
                      <div className="truncate mr-2">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Razorpay Subscription ID
                        </span>
                        <span className="font-semibold">{sub.razorpaySubscriptionId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(sub.razorpaySubscriptionId!)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer shrink-0"
                        title="Copy Subscription ID"
                      >
                        {copiedId ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Creation Metadata */}
                <div className="text-[11px] text-slate-400 space-y-1 px-1">
                  <p>
                    Record created: {formatDateTime(sub.createdAt)}
                  </p>
                  {sub.updatedAt && (
                    <p>
                      Last updated: {formatDateTime(sub.updatedAt)}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/80 px-6 py-4 bg-white flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
