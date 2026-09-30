import React from "react"
import {
  Building2,
  Calendar,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  UserCheck,
} from "lucide-react"

export interface ManagementInformationProps {
  role: string
  apartmentName: string
  accountStatus?: string
  isEmailVerified?: boolean
  memberSince?: string
  accessLevel?: string
}

export function ManagementInformation({
  role = "Property Manager",
  apartmentName = "Community",
  accountStatus = "Active",
  isEmailVerified = true,
  memberSince,
}: ManagementInformationProps) {
  const formattedApartment = apartmentName
    ? apartmentName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Not assigned"

  return (
    <div className="space-y-4">
      {/* Account / Management Information Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0A3D2D] ring-1 ring-[#D8EADB]">
            <ShieldCheck className="size-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Account Information
          </h2>
        </div>

        {/* Info Rows (Consistent 48–52px row height) */}
        <div className="divide-y divide-slate-100 text-xs sm:text-[13px]">
          {/* Role */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <UserCheck className="size-4 text-slate-400 shrink-0" />
              <span>Role</span>
            </div>
            <span className="font-semibold text-slate-900">{role}</span>
          </div>

          {/* Managed Apartment */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="size-4 text-slate-400 shrink-0" />
              <span>Apartment</span>
            </div>
            <span className="font-semibold text-slate-900 truncate max-w-[160px]">
              {formattedApartment}
            </span>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="size-4 text-slate-400 shrink-0" />
              <span>Account Status</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#0B7A4B]">
              <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>{accountStatus}</span>
            </div>
          </div>

          {/* Email Verified */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="size-4 text-slate-400 shrink-0" />
              <span>Email Verified</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#0B7A4B]">
              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
              <span>{isEmailVerified ? "Yes" : "No"}</span>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="size-4 text-slate-400 shrink-0" />
              <span>Member Since</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <span>{memberSince || "Sep 2026"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Better Communities Callout Card (16px gap directly below Account Information) */}
      <div className="rounded-2xl border border-[#D5E6DC] bg-gradient-to-br from-[#EDF5F0] to-[#E5EFE9] p-4 text-[#0D382B] shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#093C2E] text-white shadow-2xs">
            <Leaf className="size-4 stroke-[2.2]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-[#08281E]">
              Better Communities, Brighter Tomorrows
            </h3>
            <p className="text-[11px] text-[#2A5141] leading-snug">
              Empowering property managers to build organized, connected, and thriving communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
