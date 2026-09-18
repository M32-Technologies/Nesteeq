"use client"

import {
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Save,
  Shield,
} from "lucide-react"
import type { ApartmentData } from "../types"

type ApartmentSettingsPanelProps = {
  apartmentData: ApartmentData | null | undefined
  isLoading: boolean
  isOwnerOrManager: boolean
  aptName: string
  setAptName: (v: string) => void
  aptAddress: string
  setAptAddress: (v: string) => void
  aptCity: string
  setAptCity: (v: string) => void
  aptState: string
  setAptState: (v: string) => void
  aptTotalUnits: string
  setAptTotalUnits: (v: string) => void
  aptTotalFloors: string
  setAptTotalFloors: (v: string) => void
  aptTotalBlocks: string
  setAptTotalBlocks: (v: string) => void
  aptParkingSlots: string
  setAptParkingSlots: (v: string) => void
  aptContact: string
  setAptContact: (v: string) => void
  aptEmergencyContact: string
  setAptEmergencyContact: (v: string) => void
  isDirty: boolean
  isSaving: boolean
  onSave: (e?: React.FormEvent) => Promise<void>
}

export function ApartmentSettingsPanel({
  apartmentData,
  isLoading,
  isOwnerOrManager,
  aptName,
  setAptName,
  aptAddress,
  setAptAddress,
  aptCity,
  setAptCity,
  aptState,
  setAptState,
  aptTotalUnits,
  setAptTotalUnits,
  aptTotalFloors,
  setAptTotalFloors,
  aptTotalBlocks,
  setAptTotalBlocks,
  aptParkingSlots,
  setAptParkingSlots,
  aptContact,
  setAptContact,
  aptEmergencyContact,
  setAptEmergencyContact,
  isDirty,
  isSaving,
  onSave,
}: ApartmentSettingsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-12 shadow-xs flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#0F5F45]" />
      </div>
    )
  }

  const displayAddress = [
    apartmentData?.address,
    apartmentData?.city,
    apartmentData?.state,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-6">
      {/* 1. Apartment Identity Card (Exact structural match to Profile Identity Card) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Building Gradient Box */}
          <div className="relative shrink-0">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F5F45] to-[#071D35] text-2xl font-bold text-white shadow-sm overflow-hidden">
              <Building2 className="size-9 text-white" />
            </div>
          </div>

          {/* Identity Meta */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 truncate capitalize">
                {apartmentData?.name || "Apartment Community"}
              </h2>

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#0F5F45] ring-1 ring-[#0F5F45]/20 uppercase">
                <Shield className="size-3" />
                {apartmentData?.status || "ACTIVE"}
              </span>

              {/* Verified Badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Registered
              </span>
            </div>

            {/* Address with MapPin */}
            <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate pt-0.5">
              <MapPin className="size-3.5 text-slate-400 shrink-0" />
              <span>{displayAddress || "Property location on record"}</span>
            </p>

            {/* Quick Metrics */}
            <p className="flex items-center gap-2 text-xs font-medium text-slate-400 pt-0.5">
              <span>{apartmentData?.totalUnits ?? "—"} Units</span>
              <span>•</span>
              <span>{apartmentData?.totalBlocks ?? "—"} Blocks</span>
              <span>•</span>
              <span>{apartmentData?.parkingSlots ?? "—"} Parking Slots</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Apartment Details Form Card (Exact structural match to Profile Personal Details Card) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="size-4 text-[#0F5F45]" />
              Apartment Details
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isOwnerOrManager
                ? "Update your society specifications and contact details."
                : "Registered apartment details for your community."}
            </p>
          </div>
          {!isOwnerOrManager && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Lock className="size-3" />
              Owner managed
            </span>
          )}
        </div>

        <form onSubmit={onSave} className="space-y-4 pt-1">
          {/* Society Name */}
          <div className="space-y-1.5">
            <label htmlFor="apt-name" className="block text-xs font-semibold text-slate-700">
              Society / Apartment Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="apt-name"
              type="text"
              value={aptName}
              onChange={(e) => setAptName(e.target.value)}
              placeholder="e.g. Greenwood Valley"
              disabled={isLoading || isSaving || !isOwnerOrManager}
              className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
              }`}
            />
          </div>

          {/* Street Address */}
          <div className="space-y-1.5">
            <label htmlFor="apt-address" className="block text-xs font-semibold text-slate-700">
              Street Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin className="size-3.5" />
              </div>
              <input
                id="apt-address"
                type="text"
                value={aptAddress}
                onChange={(e) => setAptAddress(e.target.value)}
                placeholder="e.g. Plot 42, Main Road"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* City & State (2 cols) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="apt-city" className="block text-xs font-semibold text-slate-700">
                City
              </label>
              <input
                id="apt-city"
                type="text"
                value={aptCity}
                onChange={(e) => setAptCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="apt-state" className="block text-xs font-semibold text-slate-700">
                State
              </label>
              <input
                id="apt-state"
                type="text"
                value={aptState}
                onChange={(e) => setAptState(e.target.value)}
                placeholder="e.g. Karnataka"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Total Units & Total Floors (2 cols) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="apt-units" className="block text-xs font-semibold text-slate-700">
                Total Units
              </label>
              <input
                id="apt-units"
                type="text"
                value={aptTotalUnits}
                onChange={(e) => setAptTotalUnits(e.target.value)}
                placeholder="e.g. 120"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="apt-floors" className="block text-xs font-semibold text-slate-700">
                Total Floors
              </label>
              <input
                id="apt-floors"
                type="text"
                value={aptTotalFloors}
                onChange={(e) => setAptTotalFloors(e.target.value)}
                placeholder="e.g. 14"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Total Blocks & Parking Slots (2 cols) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="apt-blocks" className="block text-xs font-semibold text-slate-700">
                Total Blocks
              </label>
              <input
                id="apt-blocks"
                type="text"
                value={aptTotalBlocks}
                onChange={(e) => setAptTotalBlocks(e.target.value)}
                placeholder="e.g. 3"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="apt-parking" className="block text-xs font-semibold text-slate-700">
                Parking Slots
              </label>
              <input
                id="apt-parking"
                type="text"
                value={aptParkingSlots}
                onChange={(e) => setAptParkingSlots(e.target.value)}
                placeholder="e.g. 150"
                disabled={isLoading || isSaving || !isOwnerOrManager}
                className={`h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                  !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Primary Desk Contact & Emergency Contact (2 cols) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="apt-contact" className="block text-xs font-semibold text-slate-700">
                Primary Desk Contact
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="size-3.5" />
                </div>
                <input
                  id="apt-contact"
                  type="tel"
                  value={aptContact}
                  onChange={(e) => setAptContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  disabled={isLoading || isSaving || !isOwnerOrManager}
                  className={`h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                    !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="apt-emergency" className="block text-xs font-semibold text-slate-700">
                Emergency Contact
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="size-3.5" />
                </div>
                <input
                  id="apt-emergency"
                  type="tel"
                  value={aptEmergencyContact}
                  onChange={(e) => setAptEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 98765 00000"
                  disabled={isLoading || isSaving || !isOwnerOrManager}
                  className={`h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${
                    !isOwnerOrManager ? "bg-slate-50 cursor-not-allowed text-slate-600" : "bg-white"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* In-Card Save Action (Identical to Profile Save Action) */}
          {isOwnerOrManager && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                  isDirty && !isSaving
                    ? "bg-[#0F5F45] text-white hover:bg-[#0c4e38] active:scale-95 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
