
// ManagerDetailsModal.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Calendar,
  Hash,
  Ban,
  UserCheck,
  Loader2,
  Home,
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
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
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#07584F]/8">
        <Icon className="h-4 w-4 text-[#07584F]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
          {label}
        </p>
        <div className={`mt-0.5 text-[13px] font-medium text-[#0F172A] ${mono ? "font-mono text-[12px]" : ""}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Header — gradient band + avatar overlapping into content */}
        <div className="relative bg-gradient-to-br from-[#07584F] to-[#0B6E62] px-6 pb-14 pt-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              {formatRoleTitle(user.role)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Avatar — straddles header/content boundary */}
        <div className="relative -mt-11 px-6">
          <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#07584F] text-2xl font-bold text-white shadow-lg">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || user.email}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{userInitial}</span>
            )}
          </span>
        </div>

        {/* Name / status / email */}
        <div className="px-6 pb-1 pt-3">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-lg font-bold text-[#0F172A]">
              {user.name || "Unnamed User"}
            </h4>
            {user.banned ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                Suspended
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Active
              </span>
            )}
          </div>
          <p className="truncate text-[12.5px] text-[#64748B]">{user.email}</p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-3">
          <div className="divide-y divide-[#F1F5F9] rounded-2xl border border-[#F1F5F9] px-4">
            <DetailRow icon={ShieldCheck} label="System Role">
              <span className="font-semibold text-[#07584F]">
                {formatRoleTitle(user.role)}
              </span>
            </DetailRow>

            <DetailRow icon={Phone} label="Contact Phone">
              {user.phone || <span className="text-[#94A3B8] font-normal">Not provided</span>}
            </DetailRow>

            <DetailRow icon={Hash} label="Apartment ID Reference" mono>
              {user.apartmentId || <span className="text-[#94A3B8] font-normal font-sans">None assigned yet</span>}
            </DetailRow>

            {user.flatId && (
              <DetailRow icon={Home} label="Flat ID Reference" mono>
                {user.flatId}
              </DetailRow>
            )}

            <DetailRow icon={Calendar} label="Registered On">
              {formattedDate}
            </DetailRow>

            <DetailRow
              icon={user.emailVerified ? CheckCircle2 : AlertTriangle}
              label="Email Verification"
            >
              <span className={user.emailVerified ? "text-emerald-700" : "text-amber-700"}>
                {user.emailVerified ? "Verified" : "Unverified"}
              </span>
            </DetailRow>
          </div>

          {/* Suspension reason (read-only, when banned) */}
          {user.banned && user.banReason && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                Suspension Reason
              </p>
              <p className="mt-0.5 text-[12.5px] text-red-700">{user.banReason}</p>
            </div>
          )}

          {/* Ban reason input */}
          {showBanInput && !user.banned && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <label htmlFor="ban-reason" className="mb-1.5 block text-[11.5px] font-semibold text-red-800">
                Reason for account suspension
              </label>
              <input
                id="ban-reason"
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Terms violation, requested deactivation..."
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-[12.5px] text-[#0F172A] outline-none placeholder:text-red-300 focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-[#F1F5F9] bg-[#F8FAF8] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#475569] shadow-2xs transition-colors hover:bg-slate-50"
          >
            Close
          </button>

          {user.banned ? (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleToggleBan}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs transition-colors hover:bg-[#064841] disabled:opacity-50"
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
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-[12.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleToggleBan}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs transition-colors hover:bg-red-700 disabled:opacity-50"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-50"
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