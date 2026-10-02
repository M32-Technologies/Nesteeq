
// ManagerDetailsModal.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Calendar,
  Building2,
  MapPin,
  Layers,
  Mail,
  Ban,
  UserCheck,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { fetchApartmentById } from "@/features/admin/apartments/api/apartment.api"
import type { BetterAuthUser } from "../types"

function formatRoleTitle(role?: string | null): string {
  if (!role) return "Resident"
  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, "_")
  if (normalized === "property_manager" || normalized === "propertymanager") return "Property Manager"
  if (normalized === "resident") return "Resident"
  if (normalized === "admin") return "Admin"
  if (normalized === "super_admin") return "Super Admin"
  if (normalized === "facility_manager") return "Facility Manager"
  if (normalized === "security_staff") return "Security Staff"
  if (normalized === "treasurer") return "Treasurer"
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")
}

type ManagerDetailsModalProps = {
  user: BetterAuthUser | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
}

function DetailRow({
  icon: Icon,
  label,
  children,
  mono = false,
}: {
  icon: typeof Phone
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3.5 py-3 first:pt-1 last:pb-1">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#07584F] border border-slate-200/50">
        <Icon className="h-4 w-4 text-[#07584F]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className={`mt-0.5 text-[13px] font-medium text-slate-900 ${mono ? "font-mono text-[12px]" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ManagerDetailsModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: ManagerDetailsModalProps) {
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [showBanInput, setShowBanInput] = useState(false)

  const [apartmentInfo, setApartmentInfo] = useState<{
    name?: string
    address?: string
    city?: string
    state?: string
    status?: string
    totalUnits?: string | number
  } | null>(
    user?.apartmentDetails || (user?.apartmentName ? { name: user.apartmentName } : null)
  )

  useEffect(() => {
    if (!user) return
    if (user.apartmentDetails) {
      setApartmentInfo(user.apartmentDetails)
      return
    }
    if (user.apartmentName) {
      setApartmentInfo({ name: user.apartmentName })
    }
    if (user.apartmentId && !user.apartmentDetails) {
      fetchApartmentById(user.apartmentId)
        .then((apt) => {
          if (apt) {
            setApartmentInfo({
              name: apt.name,
              address: apt.address,
              city: apt.city,
              state: apt.state,
              status: apt.status,
            })
          }
        })
        .catch(() => {
          // silently keep fallback
        })
    }
  }, [user?.apartmentId, user?.apartmentDetails, user?.apartmentName])

  if (!isOpen || !user) return null

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown"

  const userInitial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase()

  const handleToggleBan = async () => {
    setIsActionLoading(true)
    try {
      if (user.banned) {
        const { error } = await authClient.admin.unbanUser({ userId: user.id })
        if (error) {
          toast.error(error.message || "Failed to reinstate user.")
          return
        }
        toast.success(`${user.name || "User"} has been unbanned successfully.`)
      } else {
        const { error } = await authClient.admin.banUser({
          userId: user.id,
          banReason: banReason.trim() || "Administrative review / account suspended",
        })
        if (error) {
          toast.error(error.message || "Failed to suspend user.")
          return
        }
        toast.success(`${user.name || "User"} has been suspended.`)
      }

      setShowBanInput(false)
      setBanReason("")
      onUserUpdated()
      onClose()
    } catch {
      toast.error("Failed to update user status. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg my-auto max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#07584F]" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              User Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Hero Profile Header */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAF8] via-white to-slate-50/50 border border-slate-200/70">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#07584F] text-xl font-bold text-white shadow-md">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || user.email}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-lg font-bold text-slate-900">
                  {user.name || "Unnamed User"}
                </h4>
                {user.banned ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Suspended
                  </span>
                ) : user.emailVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Pending Verification
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* 1. Assigned Property Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#07584F]/10 text-[#07584F]">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Property
                </span>
              </div>

              {apartmentInfo?.status && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    apartmentInfo.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      apartmentInfo.status === "active"
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />
                  {apartmentInfo.status === "active"
                    ? "Active Community"
                    : "Inactive Community"}
                </span>
              )}
            </div>

            <div className="pt-3">
              {apartmentInfo?.name || user.apartmentName ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-base font-bold text-slate-900">
                      {apartmentInfo?.name || user.apartmentName}
                    </p>
                    {apartmentInfo?.totalUnits && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <span>{apartmentInfo.totalUnits} Units</span>
                      </span>
                    )}
                  </div>

                  {(apartmentInfo?.city || apartmentInfo?.address) && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>
                        {[
                          apartmentInfo.address,
                          apartmentInfo.city,
                          apartmentInfo.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ) : user.apartmentId ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">
                    Apartment Reference:
                  </p>
                  <p className="font-mono text-xs text-slate-700 bg-white border border-slate-200/60 rounded-lg px-2.5 py-1 w-fit">
                    {user.apartmentId}
                  </p>
                </div>
              ) : (
                <div className="py-1 text-xs text-slate-400 font-medium">
                  No property assigned to this user yet.
                </div>
              )}
            </div>
          </div>

          {/* 2. Account Details Card */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white px-4 py-1">
            <DetailRow icon={ShieldCheck} label="System Role">
              <span className="font-semibold text-[#07584F]">
                {formatRoleTitle(user.role)}
              </span>
            </DetailRow>

            <DetailRow icon={Phone} label="Contact Phone">
              {user.phone ? (
                <span className="font-medium text-slate-900">{user.phone}</span>
              ) : (
                <span className="text-slate-400 font-normal">Not provided</span>
              )}
            </DetailRow>

            <DetailRow icon={Calendar} label="Registered On">
              <span className="text-slate-700">{formattedDate}</span>
            </DetailRow>

            <DetailRow
              icon={user.emailVerified ? CheckCircle2 : AlertTriangle}
              label="Email Verification"
            >
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  user.emailVerified ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {user.emailVerified ? "Verified Account" : "Pending Verification"}
              </span>
            </DetailRow>
          </div>

          {/* Suspension reason (read-only, when banned) */}
          {user.banned && user.banReason && (
            <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
                Suspension Reason
              </p>
              <p className="mt-1 text-xs text-red-800">{user.banReason}</p>
            </div>
          )}

          {/* Ban reason input */}
          {showBanInput && !user.banned && (
            <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
              <label
                htmlFor="ban-reason"
                className="block text-xs font-semibold text-red-900"
              >
                Reason for account suspension
              </label>
              <input
                id="ban-reason"
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Terms violation, deactivation request..."
                className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none placeholder:text-red-300 focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>

          {user.banned ? (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleToggleBan}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#064841] disabled:opacity-50 cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              <span>Reinstate User</span>
            </button>
          ) : showBanInput ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBanInput(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleToggleBan}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {isActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                <span>Confirm Suspension</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBanInput(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-50 cursor-pointer"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Suspend Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}