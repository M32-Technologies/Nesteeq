"use client"

import { useState, useEffect } from "react"
import {
  X,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Layers,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Loader2,
} from "lucide-react"
import { fetchApartmentById } from "../api/apartment.api"
import type { ApartmentDetail } from "../types"

type ApartmentDetailsModalProps = {
  apartmentId: string | null
  isOpen: boolean
  onClose: () => void
}

function DetailRow({
  icon: Icon,
  label,
  children,
  mono = false,
}: {
  icon: typeof Phone | typeof Building2 | typeof Calendar
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#07584F]/8 text-[#07584F]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
          {label}
        </p>
        <div
          className={`mt-0.5 text-[13px] font-medium text-[#0F172A] ${
            mono ? "font-mono text-[12px]" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ApartmentDetailsModal({
  apartmentId,
  isOpen,
  onClose,
}: ApartmentDetailsModalProps) {
  const [details, setDetails] = useState<ApartmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !apartmentId) {
      setDetails(null)
      setError(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    fetchApartmentById(apartmentId)
      .then((data) => {
        if (isMounted) {
          setDetails(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load community details. Please try again.")
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, apartmentId])

  if (!isOpen) return null

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            <span>Active</span>
          </span>
        )
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-800">
            <Clock className="h-3 w-3 text-amber-700" />
            <span>Pending Payment</span>
          </span>
        )
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-red-800">
            <XCircle className="h-3 w-3 text-red-700" />
            <span>Inactive</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-700">
            {status || "Unknown"}
          </span>
        )
    }
  }

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return String(dateStr)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient band */}
        <div className="relative bg-gradient-to-br from-[#07584F] to-[#0B6E62] px-6 pb-12 pt-5 text-white">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Building2 className="h-3.5 w-3.5" />
              Community Profile
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

        {/* Floating Building Icon */}
        <div className="relative -mt-9 px-6 flex items-end justify-between">
          <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#07584F] text-2xl font-bold text-white shadow-lg">
            <Building2 className="h-8 w-8 stroke-[1.8]" />
          </span>
          {details && (
            <div className="pb-1">
              {renderStatusBadge(details.status)}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-[#07584F]" />
              <p className="text-xs font-medium text-[#64748B]">Loading community profile...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-600 text-xs space-y-2">
              <AlertTriangle className="h-6 w-6 mx-auto text-red-500" />
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : details ? (
            <>
              {/* Title & Location */}
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  {details.name}
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                  <MapPin className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                  <span>
                    {details.address}, {details.city}, {details.state}
                  </span>
                </p>
              </div>

              {/* Property Specs Section */}
              <div className="divide-y divide-[#F1F5F9] rounded-2xl border border-[#F1F5F9] px-4 bg-slate-50/40">
                <DetailRow icon={Layers} label="Community Layout">
                  <span>
                    {details.totalUnits} Units · {details.totalBlocks} Blocks
                    {details.totalFloors ? ` · ${details.totalFloors} Floors` : ""}
                  </span>
                </DetailRow>

                <DetailRow icon={Car} label="Parking Allocation">
                  <span>{details.parkingSlots || "0"} Parking Slots</span>
                </DetailRow>

                <DetailRow icon={Phone} label="Office Contact">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{details.contactNumber || "Not listed"}</span>
                    {details.emergencyContact && (
                      <span className="text-xs text-[#64748B]">
                        (Emergency: {details.emergencyContact})
                      </span>
                    )}
                  </div>
                </DetailRow>

                <DetailRow icon={Calendar} label="Registration Date">
                  <span>{formatDate(details.createdAt)}</span>
                </DetailRow>
              </div>

              {/* Property Manager Info */}
              <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] mb-3">
                  <User className="h-4 w-4 text-[#07584F]" />
                  <span>Assigned Property Manager</span>
                </div>

                {details.user ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF5EE] text-[#07584F] font-bold text-sm">
                      {details.user.name?.charAt(0).toUpperCase() ||
                        details.user.email?.charAt(0).toUpperCase() ||
                        "M"}
                    </span>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-[#0F172A] truncate">
                        {details.user.name || "Manager"}
                      </p>
                      <p className="text-[#64748B] truncate">{details.user.email}</p>
                      {details.user.phone && (
                        <p className="text-[#94A3B8] text-[11px] mt-0.5">
                          {details.user.phone}
                        </p>
                      )}
                    </div>
                    {details.user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        Unverified
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] italic">
                    Manager details not available or manager account unlinked.
                  </p>
                )}
              </div>

              {/* Subscription Plan Info */}
              <div className="rounded-2xl border border-[#EEF1EF] bg-[#F8FAF8] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] mb-2">
                  <CreditCard className="h-4 w-4 text-[#07584F]" />
                  <span>Subscription Plan</span>
                </div>

                {details.currentSubscription ? (
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">
                        {details.currentSubscription.planSnapshot?.planName ||
                          details.currentSubscription.planSnapshot?.name ||
                          "Platform Plan"}
                      </p>
                      <p className="text-[#64748B] text-[11px] capitalize">
                        Billing:{" "}
                        {details.currentSubscription.planSnapshot?.planType ||
                          details.currentSubscription.planSnapshot?.interval ||
                          "Monthly"}
                        {details.currentSubscription.planSnapshot?.price
                          ? ` · ₹${details.currentSubscription.planSnapshot.price.toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-[#EAF5EE] px-2 py-1 text-xs font-semibold text-[#07584F] capitalize">
                      {details.currentSubscription.status || "active"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-[#64748B]">
                      {details.status === "pending_payment"
                        ? "Awaiting initial subscription setup and payment."
                        : "No active subscription attached."}
                    </p>
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
                      Pending
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
