import React from "react"
import {
  Building2,
  Calendar,
  Leaf,
  ShieldCheck,
  UserCheck,
} from "lucide-react"

export interface WorkInformationProps {
  role: string
  apartmentName?: string
  accountStatus?: string
  memberSince?: string
}

export function WorkInformation({
  role = "Staff Member",
  apartmentName = "Community",
  accountStatus = "Active",
  memberSince,
}: WorkInformationProps) {
  const formattedApartment = apartmentName
    ? apartmentName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Not assigned"

  return (
    <div className="space-y-4">
      {/* Work Information Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0A3D2D] ring-1 ring-[#D8EADB]">
            <ShieldCheck className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Work Information
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Your role and account information.
            </p>
          </div>
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

          {/* Apartment */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="size-4 text-slate-400 shrink-0" />
              <span>Apartment</span>
            </div>
            <span className="font-semibold text-slate-900 truncate max-w-[170px]" title={formattedApartment}>
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

      {/* Better Communities Callout Card (16px gap directly below Work Information) */}
      <div className="rounded-2xl border border-[#D5E6DC] bg-gradient-to-br from-[#EDF5F0] to-[#E5EFE9] p-4 sm:p-4.5 text-[#0D382B] shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#093C2E] text-white shadow-2xs">
            <Leaf className="size-4.5 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-[13px] font-bold text-[#08281E] leading-tight">
              Better Communities, Brighter Tomorrows
            </h3>
            <p className="text-[11px] sm:text-xs text-[#2A5141] leading-relaxed">
              Thank you for helping keep our communities safe, clean, and well-maintained.
            </p>
            {/* Subtle gold accent underline from design mockup */}
            <div className="w-8 h-0.5 bg-[#C59B27] rounded-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
