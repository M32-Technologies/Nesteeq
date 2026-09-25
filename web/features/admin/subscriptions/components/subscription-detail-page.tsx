"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { format, isValid } from "date-fns"
import { fetchSingleSubscription } from "../api/subscription.api"
import type { SubscriptionItem } from "../types"
import { renderSubscriptionStatusBadge } from "./subscription-details-drawer"

type SubscriptionDetailPageProps = {
  subscriptionId: string
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

export default function SubscriptionDetailPage({
  subscriptionId,
}: SubscriptionDetailPageProps) {
  const [subscription, setSubscription] = useState<SubscriptionItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchSingleSubscription(subscriptionId)
      setSubscription(data)
    } catch {
      setError("Unable to retrieve subscription details. The record may not exist or has expired.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [subscriptionId])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Navigation / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscriptions"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Subscription Details
            </h1>
            <p className="text-xs text-[#64748B]">
              Viewing record for {subscription?.apartment?.name || "Apartment"}
            </p>
          </div>
        </div>

        {subscription && (
          <div className="flex items-center gap-2">
            {renderSubscriptionStatusBadge(subscription.status)}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
          <Loader2 className="h-8 w-8 animate-spin text-[#07584F] mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading subscription...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-red-950">Record Error</h2>
          <p className="text-xs text-red-800 mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Subscriptions
            </Link>
          </div>
        </div>
      ) : subscription ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    Plan Overview
                  </span>
                  <h2 className="text-xl font-bold text-[#0F172A] mt-1">
                    {subscription.planSnapshot?.planName || "—"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {subscription.planSnapshot?.durationMonths
                      ? `${subscription.planSnapshot.durationMonths} Month Duration`
                      : subscription.planSnapshot?.planType || ""}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-[#07584F] tabular-nums">
                    {formatINR(subscription.planSnapshot?.price, subscription.planSnapshot?.currency)}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">Per billing cycle</span>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-[#07584F]" />
                    <span>Subscription Start Date</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {formatDate(subscription.currentStart || subscription.startAt || subscription.createdAt)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(subscription.currentStart || subscription.startAt || subscription.createdAt)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                    <Clock className="h-3.5 w-3.5 text-[#07584F]" />
                    <span>Next Renewal / End</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {formatDate(subscription.chargeAt || subscription.currentEnd || subscription.endAt)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(subscription.chargeAt || subscription.currentEnd || subscription.endAt)}
                  </p>
                </div>
              </div>

              {/* Trial Information */}
              {subscription.isTrial && (
                <div className="rounded-xl border border-emerald-200 bg-[#EAF5EE]/40 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#07584F]">
                    <Sparkles className="h-4 w-4 text-[#07584F]" />
                    <span>Active Trial</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    This community is on an active trial plan.
                  </p>
                  {subscription.trialEndsAt && (
                    <p className="text-xs font-semibold text-[#07584F]">
                      Trial expires on: {formatDate(subscription.trialEndsAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Cancellation info */}
              {(subscription.cancelledAt || subscription.cancelReason || subscription.cancelAtCycleEnd) && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Cancellation Details</span>
                  </div>
                  {subscription.cancelledAt && (
                    <p className="text-xs text-slate-700">
                      Cancelled on: <span className="font-semibold">{formatDateTime(subscription.cancelledAt)}</span>
                    </p>
                  )}
                  {subscription.cancelAtCycleEnd && (
                    <p className="text-xs text-amber-700 font-medium">
                      Cancellation is scheduled for the end of the current billing cycle.
                    </p>
                  )}
                  {subscription.cancelReason && (
                    <p className="text-xs text-slate-600 italic">
                      Reason: &ldquo;{subscription.cancelReason}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Apartment Society Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                <Building2 className="h-4 w-4 text-[#07584F]" />
                <span>Apartment Community</span>
              </div>

              <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                <p className="text-sm font-bold text-[#0F172A]">
                  {subscription.apartment?.name || "Apartment"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {subscription.apartment?.city || "—"}
                  {subscription.apartment?.state ? `, ${subscription.apartment.state}` : ""}
                </p>
              </div>
            </div>

            {/* Gateway Reference Card */}
            {subscription.razorpaySubscriptionId && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                  <ShieldCheck className="h-4 w-4 text-[#07584F]" />
                  <span>Razorpay Reference</span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 font-mono text-xs flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Subscription ID
                    </span>
                    <span className="font-semibold text-slate-800">
                      {subscription.razorpaySubscriptionId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(subscription.razorpaySubscriptionId!)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
                    title="Copy ID"
                  >
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Metadata Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs text-[11px] text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-semibold text-slate-700">
                  {formatDateTime(subscription.createdAt)}
                </span>
              </div>
              {subscription.updatedAt && (
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateTime(subscription.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
