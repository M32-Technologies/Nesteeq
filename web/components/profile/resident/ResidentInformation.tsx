import React from "react"
import {
  Building2,
  Calendar,
  CheckCircle2,
  Home,
  Leaf,
  ShieldCheck,
  UserCheck,
} from "lucide-react"

export interface ResidentInformationProps {
  role?: string
  flatName?: string
  apartmentName?: string
  accountStatus?: string
  isEmailVerified?: boolean
  memberSince?: string
}

export function ResidentInformation({
  role = "Resident",
  flatName,
  apartmentName = "Community",
  accountStatus = "Active",
  isEmailVerified = true,
  memberSince,
}: ResidentInformationProps) {
  const formattedApartment = apartmentName
    ? apartmentName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Not assigned"

  const formattedFlat = flatName || "Unit Assigned"

  return (
    <div className="space-y-4">
      {/* Residence & Account Information Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0A3D2D] ring-1 ring-[#D8EADB]">
            <ShieldCheck className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Residence & Account Information
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Your unit and society membership details.
            </p>
          </div>
        </div>

        {/* Info Rows */}
        <div className="divide-y divide-slate-100 text-xs sm:text-[13px]">
          {/* Role */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <UserCheck className="size-4 text-slate-400 shrink-0" />
              <span>Role</span>
            </div>
            <span className="font-semibold text-slate-900">{role}</span>
          </div>

          {/* Residence Flat / Unit */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Home className="size-4 text-slate-400 shrink-0" />
              <span>Residence Unit</span>
            </div>
            <span className="inline-flex items-center rounded-md bg-[#F0F7F3] px-2 py-0.5 font-semibold text-[#0A3D2D] ring-1 ring-[#D8EADB]">
              {formattedFlat}
            </span>
          </div>

          {/* Apartment */}
          <div className="flex items-center justify-between min-h-[48px] py-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="size-4 text-slate-400 shrink-0" />
              <span>Apartment</span>
            </div>
            <span
              className="font-semibold text-slate-900 truncate max-w-[170px]"
              title={formattedApartment}
            >
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

      {/* Better Communities Callout Card */}
      <div className="rounded-2xl border border-[#D5E6DC] bg-gradient-to-br from-[#EDF5F0] to-[#E5EFE9] p-4 text-[#0D382B] shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#093C2E] text-white shadow-2xs">
            <Leaf className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
              Connected Community Living
            </h3>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              Enjoy peaceful living, stay connected with society updates, and access amenities effortlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
