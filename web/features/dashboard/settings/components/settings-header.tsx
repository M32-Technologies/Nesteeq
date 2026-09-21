"use client"

import { Loader2, Save } from "lucide-react"
import type { SettingsTab } from "../types"

type SettingsHeaderProps = {
  activeTab: SettingsTab
  isProfileDirty: boolean
  isSubmittingProfile: boolean
  onSaveProfile: () => void
  isApartmentDirty: boolean
  isSavingApartment: boolean
  isOwnerOrManager: boolean
  onSaveApartment: () => void
  subscriptionStatus?: string
}

export function SettingsHeader({
  activeTab,
  isProfileDirty,
  isSubmittingProfile,
  onSaveProfile,
  isApartmentDirty,
  isSavingApartment,
  isOwnerOrManager,
  onSaveApartment,
  subscriptionStatus,
}: SettingsHeaderProps) {
  const isCurrentDirty =
    (activeTab === "profile" && isProfileDirty) ||
    (activeTab === "apartment" && isApartmentDirty && isOwnerOrManager)

  const isSaving = isSubmittingProfile || isSavingApartment

  const handleTopSave = () => {
    if (activeTab === "profile") {
      onSaveProfile()
    } else if (activeTab === "apartment" && isOwnerOrManager) {
      onSaveApartment()
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account Settings
          </h1>
          {isCurrentDirty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Manage your personal profile, apartment property details, and active community subscription.
        </p>
      </div>

      {/* Top Action Button */}
      <div>
        {(activeTab === "profile" || (activeTab === "apartment" && isOwnerOrManager)) && (
          <button
            type="button"
            onClick={handleTopSave}
            disabled={!isCurrentDirty || isSaving}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs ${
              isCurrentDirty && !isSaving
                ? "bg-[#0F5F45] text-white hover:bg-[#0c4e38] active:scale-95 shadow-[#0F5F45]/20 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}

        {activeTab === "subscription" && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{subscriptionStatus ? `Plan: ${subscriptionStatus}` : "Active Subscription"}</span>
          </span>
        )}
      </div>
    </div>
  )
}
