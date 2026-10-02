"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Calendar,
  Check,
  CreditCard,
  Loader2,
  Shield,
} from "lucide-react"
import api from "@/lib/axios"
import type { SubscriptionData, SubscriptionPlanItem } from "../types"

type SubscriptionSettingsPanelProps = {
  subscriptionData: SubscriptionData | null | undefined
  isLoading: boolean
}

export function SubscriptionSettingsPanel({
  subscriptionData,
  isLoading,
}: SubscriptionSettingsPanelProps) {
  // Fetch plan details from database
  const { data: plansData } = useQuery<SubscriptionPlanItem[]>({
    queryKey: ["all-subscription-plans"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/v1/subscription-plans")
        return res.data?.data || []
      } catch {
        return []
      }
    },
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-12 shadow-xs flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#0F5F45]" />
      </div>
    )
  }

  const currentPlanName = subscriptionData?.planSnapshot?.planName || "Community Plan"
  const priceDisplay = subscriptionData?.planSnapshot?.price
    ? `₹${subscriptionData.planSnapshot.price.toLocaleString()}`
    : "Active Plan"

  // Extract features for this plan from the database
  const matchedPlan = plansData?.find(
    (p) =>
      p.planType?.toUpperCase() === subscriptionData?.planSnapshot?.planType?.toUpperCase() ||
      p.planName?.toLowerCase() === currentPlanName.toLowerCase()
  )

  const features = matchedPlan?.features && matchedPlan.features.length > 0
    ? matchedPlan.features
    : [
        "Full Community Management Dashboard Access",
        "Visitor & Delivery Tracking at Gates",
        "Maintenance & Resident Complaints Handling",
        "Resident & Flat Directory Management",
        "Digital Announcements & Noticeboard",
        "Security Guard & Gate Pass Operations",
      ]

  const formattedStartDate = subscriptionData?.createdAt
    ? new Date(subscriptionData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="space-y-6">
      {/* 1. Subscription Identity Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Icon Gradient Box */}
          <div className="relative shrink-0">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F5F45] to-[#071D35] text-2xl font-bold text-white shadow-sm overflow-hidden">
              <CreditCard className="size-9 text-white" />
            </div>
          </div>

          {/* Identity Meta */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {currentPlanName}
              </h2>

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#0F5F45] ring-1 ring-[#0F5F45]/20 uppercase">
                <Shield className="size-3" />
                {subscriptionData?.status || "ACTIVE"}
              </span>

              {subscriptionData?.isTrial && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                  Free Trial
                </span>
              )}
            </div>

            {/* Price */}
            <p className="text-xs font-semibold text-slate-700 pt-0.5">
              {priceDisplay}
            </p>

            {/* Active Date */}
            {formattedStartDate && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                <Calendar className="size-3.5 text-slate-400 shrink-0" />
                <span>Active since {formattedStartDate}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Plan Details & Features Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="size-4 text-[#0F5F45]" />
            Plan Details
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Overview of your active community plan and included features.
          </p>
        </div>

        {subscriptionData ? (
          <div className="space-y-4 pt-1">
            {/* Clean Plan Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Current Plan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Current Plan
                </label>
                <div className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 flex items-center text-xs text-slate-800 font-semibold">
                  {currentPlanName}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Plan Status
                </label>
                <div className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 flex items-center text-xs text-emerald-700 font-semibold uppercase">
                  {subscriptionData.status || "ACTIVE"}
                </div>
              </div>
            </div>

            {/* Included Features Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="block text-xs font-semibold text-slate-700">
                Included in your plan:
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {features.map((feat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 text-xs text-slate-700 font-medium"
                  >
                    <Check className="size-3.5 text-[#0F5F45] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">No active subscription found.</p>
            <p className="mt-1 text-slate-400">Your community subscription can be activated through the billing portal.</p>
          </div>
        )}
      </div>
    </div>
  )
}
