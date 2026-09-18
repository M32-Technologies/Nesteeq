"use client"

import { Building2, CreditCard, User } from "lucide-react"
import type { SettingsTab } from "../types"

type SettingsNavProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  apartmentName?: string
  subscriptionStatus?: string
}

export function SettingsNav({
  activeTab,
  onTabChange,
  apartmentName,
  subscriptionStatus,
}: SettingsNavProps) {
  return (
    <aside className="lg:col-span-3">
      {/* Pure White Card Box Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs space-y-1">
        <div className="px-3 pt-1.5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Settings Menu
          </span>
        </div>

        {/* 1. My Profile */}
        <button
          type="button"
          id="tab-btn-profile"
          onClick={() => onTabChange("profile")}
          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#0F5F45] text-white shadow-xs font-bold"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <User className={`size-4 ${activeTab === "profile" ? "text-white" : "text-slate-400"}`} />
            <span>My Profile</span>
          </div>
          {activeTab === "profile" && (
            <div className="size-1.5 rounded-full bg-white" />
          )}
        </button>

        {/* 2. Apartment Section */}
        <button
          type="button"
          id="tab-btn-apartment"
          onClick={() => onTabChange("apartment")}
          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === "apartment"
              ? "bg-[#0F5F45] text-white shadow-xs font-bold"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className={`size-4 shrink-0 ${activeTab === "apartment" ? "text-white" : "text-slate-400"}`} />
            <span className="truncate">Apartment</span>
          </div>
          {apartmentName && (
            <span
              className={`max-w-[75px] truncate rounded px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "apartment"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {apartmentName}
            </span>
          )}
        </button>

        {/* 3. Subscription Section */}
        <button
          type="button"
          id="tab-btn-subscription"
          onClick={() => onTabChange("subscription")}
          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === "subscription"
              ? "bg-[#0F5F45] text-white shadow-xs font-bold"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className={`size-4 ${activeTab === "subscription" ? "text-white" : "text-slate-400"}`} />
            <span>Subscription</span>
          </div>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              activeTab === "subscription"
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
            }`}
          >
            {subscriptionStatus || "Active"}
          </span>
        </button>
      </div>
    </aside>
  )
}
