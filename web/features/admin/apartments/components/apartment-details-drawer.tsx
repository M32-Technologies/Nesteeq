"use client"

import { useState, useEffect } from "react"
import {
  X,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Layers,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  ShieldCheck,
  Building,
  Loader2,
  AlertCircle,
  Ban,
} from "lucide-react"
import { toast } from "sonner"
import { fetchApartmentById, updateApartmentStatus } from "../api/apartment.api"
import type { ApartmentDetail } from "../types"

type ApartmentDetailsDrawerProps = {
  apartmentId: string | null
  isOpen: boolean
  onClose: () => void
  onApartmentUpdated?: () => void
}


function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2 pb-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
        {title}
      </p>
    </div>
  )
}

function DetailItem({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  icon?: typeof Phone | typeof Building2 | typeof Calendar
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between py-2.5 text-xs">
      <div className="flex items-center gap-2 text-[#64748B]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />}
        <span>{label}</span>
      </div>
      <div
        className={`font-medium text-[#0F172A] text-right ${
          mono ? "font-mono text-[11.5px]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default function ApartmentDetailsDrawer({
  apartmentId,
  isOpen,
  onClose,
  onApartmentUpdated,
}: ApartmentDetailsDrawerProps) {
  const [details, setDetails] = useState<ApartmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    if (!details || !apartmentId) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateApartmentStatus(apartmentId, newStatus)
      setDetails((prev) => (prev ? { ...prev, status: updated.status } : null))
      toast.success(
        `${details.name} is now ${newStatus === "active" ? "active" : "inactive"}.`
      )
      if (onApartmentUpdated) {
        onApartmentUpdated()
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update apartment status."
      toast.error(message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }


  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Fetch single apartment details when drawer opens
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
          setError("Unable to load community details. Please try again.")
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Active</span>
          </span>
        )
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Pending Payment</span>
          </span>
        )
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
            <XCircle className="h-3 w-3 text-red-600" />
            <span>Inactive</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
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
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return String(dateStr)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Drawer Header */}
          <div className="border-b border-[#EEF1EF] bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-100">
                  <Building2 className="h-4.5 w-4.5 stroke-[1.8]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] leading-tight">
                    Apartment Details
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    Full community profile &amp; subscription
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#07584F]" />
                <p className="text-xs font-medium text-[#64748B]">
                  Fetching apartment details...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 text-center text-xs space-y-2">
                <AlertCircle className="h-6 w-6 mx-auto text-red-600" />
                <p className="font-semibold text-red-900">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : details ? (
              <>
                {/* Community Primary Card */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-[#F8FAF8] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                        {details.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                        <span>
                          {details.address}, {details.city}, {details.state}
                        </span>
                      </p>
                    </div>
                    {renderStatusBadge(details.status)}
                  </div>
                </div>

                {/* Status Management & Action */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4 space-y-3">
                  <SectionHeader title="Community Status & Access Control" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-[#F1F5F9]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F172A]">Current:</span>
                        {renderStatusBadge(details.status)}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {details.status === "active"
                          ? "This community is live with full resident and manager access."
                          : details.status === "pending_payment"
                          ? "Awaiting subscription payment, but admin can activate immediately."
                          : "This community is deactivated. Portal access is blocked."}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {details.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange("inactive")}
                          disabled={isUpdatingStatus}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          <span>Deactivate</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange("active")}
                          disabled={isUpdatingStatus}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#064e46] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Activate Community</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>


                {/* Property Layout & Specs */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4">
                  <SectionHeader title="Property Specifications" />
                  <div className="divide-y divide-[#F1F5F9]">
                    <DetailItem
                      label="Total Units"
                      value={`${details.totalUnits} Units`}
                      icon={Layers}
                    />
                    <DetailItem
                      label="Blocks & Floors"
                      value={`${details.totalBlocks} Blocks${
                        details.totalFloors ? ` · ${details.totalFloors} Floors` : ""
                      }`}
                      icon={Building}
                    />
                    <DetailItem
                      label="Parking Allocation"
                      value={`${details.parkingSlots || "0"} Slots`}
                      icon={Car}
                    />
                    <DetailItem
                      label="Office Phone"
                      value={details.contactNumber || "Not provided"}
                      icon={Phone}
                    />
                    {details.emergencyContact && (
                      <DetailItem
                        label="Emergency Contact"
                        value={details.emergencyContact}
                        icon={AlertTriangle}
                      />
                    )}
                  </div>
                </div>

                {/* Assigned Property Manager */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4">
                  <SectionHeader title="Assigned Property Manager" />
                  {details.user ? (
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] font-bold text-sm border border-emerald-100">
                          {details.user.name?.charAt(0).toUpperCase() ||
                            details.user.email?.charAt(0).toUpperCase() ||
                            "M"}
                        </span>
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-semibold text-[#0F172A] truncate">
                            {details.user.name || "Manager"}
                          </p>
                          <p className="text-[#64748B] truncate">
                            {details.user.email}
                          </p>
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

                      <div className="divide-y divide-[#F1F5F9] pt-1">
                        <DetailItem
                          label="Manager Phone"
                          value={details.user.phone || "Not provided"}
                          icon={Phone}
                        />
                        <DetailItem
                          label="Account Role"
                          value={details.user.role || "property_manager"}
                          icon={ShieldCheck}
                          mono
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#94A3B8] italic">
                      No manager account currently linked to this apartment.
                    </p>
                  )}
                </div>

                {/* Subscription Plan & Billing */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4">
                  <SectionHeader title="Subscription Plan" />
                  {details.currentSubscription ? (
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-[#EAF5EE] p-3 border border-emerald-100">
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="h-4 w-4 text-[#07584F]" />
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">
                              {details.currentSubscription.planSnapshot?.planName ||
                                details.currentSubscription.planSnapshot?.name ||
                                "Platform Plan"}
                            </p>
                            <p className="text-[11px] text-[#07584F] capitalize">
                              {details.currentSubscription.planSnapshot?.planType ||
                                details.currentSubscription.planSnapshot?.interval ||
                                "Monthly"}{" "}
                              billing
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-xs font-bold text-[#07584F] shadow-2xs capitalize">
                          {details.currentSubscription.status || "active"}
                        </span>
                      </div>

                      <div className="divide-y divide-[#F1F5F9]">
                        {details.currentSubscription.planSnapshot?.price !== undefined && (
                          <DetailItem
                            label="Plan Price"
                            value={`₹${details.currentSubscription.planSnapshot.price.toLocaleString()} ${
                              details.currentSubscription.planSnapshot.currency || "INR"
                            }`}
                          />
                        )}
                        {details.currentSubscription.currentStart && (
                          <DetailItem
                            label="Current Start"
                            value={formatDate(details.currentSubscription.currentStart)}
                          />
                        )}
                        {details.currentSubscription.currentEnd && (
                          <DetailItem
                            label="Current End"
                            value={formatDate(details.currentSubscription.currentEnd)}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-amber-50 p-3 border border-amber-200">
                      <div className="text-xs">
                        <p className="font-semibold text-amber-900">
                          {details.status === "pending_payment"
                            ? "Awaiting Subscription Setup"
                            : "No Active Subscription"}
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Payment has not yet been activated for this community.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata & Timestamps */}
                <div className="rounded-2xl border border-[#EEF1EF] bg-white p-4">
                  <SectionHeader title="Record Timestamps" />
                  <div className="divide-y divide-[#F1F5F9]">
                    <DetailItem
                      label="Apartment ID"
                      value={details._id}
                      mono
                    />
                    <DetailItem
                      label="Created On"
                      value={formatDate(details.createdAt)}
                    />
                    <DetailItem
                      label="Last Updated"
                      value={formatDate(details.updatedAt)}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-[#EEF1EF] bg-slate-50 px-6 py-3.5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
