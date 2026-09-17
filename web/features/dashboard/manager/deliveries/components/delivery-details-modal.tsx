"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  Check,
  Clock,
  Copy,
  Package,
  Phone,
  Truck,
  X,
} from "lucide-react"
import { Portal } from "@/components/portal"
import type { DeliveryRecord } from "../types/deliveries"

interface DeliveryDetailsModalProps {
  delivery: DeliveryRecord | null
  open: boolean
  onClose: () => void
}

// Unified status badge colors matching dashboard theme
const statusConfig = {
  WAITING: {
    bg: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-500",
    label: "Pending Pickup",
    description: "Package received at gate desk. Awaiting resident collection.",
  },
  NOTIFIED: {
    bg: "bg-sky-50 text-sky-700 border-sky-200/80",
    dot: "bg-sky-500",
    label: "Resident Notified",
    description: "Alert dispatched to resident. Pending pickup.",
  },
  COLLECTED: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-500",
    label: "Delivered & Collected",
    description: "Handed over to resident.",
  },
  RETURNED: {
    bg: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-500",
    label: "Returned to Courier",
    description: "Uncollected package returned to courier.",
  },
} as const

function formatDetailDate(dateStr?: string | null) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export default function DeliveryDetailsModal({
  delivery,
  open,
  onClose,
}: DeliveryDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  if (!open || !delivery) return null

  const currentStatus =
    statusConfig[delivery.status as keyof typeof statusConfig] ||
    statusConfig.WAITING

  const isCollected = delivery.status === "COLLECTED"
  const isReturned = delivery.status === "RETURNED"

  const handleCopyId = () => {
    if (!delivery.id) return
    navigator.clipboard.writeText(delivery.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Portal>
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all my-8 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Package size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-slate-900">
                    {delivery.deliveryCompany || "Independent Courier"}
                  </h3>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-semibold text-slate-700">
                    Flat {delivery.flatNumber}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${currentStatus.bg}`}
                  >
                    <span className={`size-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    {delivery.deliveryType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body Content */}
          <div className="max-h-[72vh] overflow-y-auto p-6 space-y-4">
            {/* Destination & Resident Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  Destination & Resident
                </span>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                  Verified Unit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Flat / Unit</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {delivery.flatNumber || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Resident Name</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                    {delivery.residentName || "Direct to Flat"}
                  </span>
                  {delivery.residentPhone && (
                    <a
                      href={`tel:${delivery.residentPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition mt-1"
                    >
                      <Phone size={11} /> {delivery.residentPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Courier & Delivery Agent Logistics Card */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Truck size={13} className="text-slate-400" />
                Courier Logistics
              </span>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Carrier</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {delivery.deliveryCompany || "Independent"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Delivery Agent</span>
                  <span className="font-medium text-slate-800 mt-0.5 block truncate">
                    {delivery.deliveryPersonName || "Not Recorded"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Agent Contact</span>
                  {delivery.deliveryPersonPhone ? (
                    <a
                      href={`tel:${delivery.deliveryPersonPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition mt-0.5"
                    >
                      <Phone size={10} /> {delivery.deliveryPersonPhone}
                    </a>
                  ) : (
                    <span className="text-slate-400 mt-0.5 block">—</span>
                  )}
                </div>
              </div>

              {delivery.packageDescription && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block text-[11px]">Package Description</span>
                  <p className="text-slate-700 mt-0.5 font-medium">{delivery.packageDescription}</p>
                </div>
              )}

              {delivery.notes && (
                <div className="mt-3 text-xs bg-amber-50/70 p-3 rounded-lg border border-amber-200/60 text-amber-800">
                  <span className="font-semibold block text-[11px] text-amber-900">Gate Instructions:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{delivery.notes}</p>
                </div>
              )}
            </div>

            {/* Audit Trail & Gate Stepper Timeline */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                Gate Audit Timeline
              </span>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {/* 1. Received at Security Desk */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 flex size-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Logged at Gate Checkpoint
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDetailDate(delivery.receivedAt) || "Time recorded upon scan"}
                    </p>
                    {delivery.receivedBy && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Officer ID: {delivery.receivedBy.toString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Resident Notification */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-1 flex size-2.5 items-center justify-center rounded-full ring-4 ring-white ${
                      delivery.notifiedAt ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Resident Notification
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {delivery.notifiedAt
                        ? `Notification dispatched on ${formatDetailDate(delivery.notifiedAt)}`
                        : "Awaiting notification dispatch"}
                    </p>
                  </div>
                </div>

                {/* 3. Handover / Return State */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-1 flex size-2.5 items-center justify-center rounded-full ring-4 ring-white ${
                      isCollected
                        ? "bg-emerald-600"
                        : isReturned
                        ? "bg-rose-500"
                        : "bg-slate-200"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isCollected
                          ? "text-emerald-700"
                          : isReturned
                          ? "text-rose-700"
                          : "text-slate-400"
                      }`}
                    >
                      {isCollected
                        ? "Handed Over to Resident"
                        : isReturned
                        ? "Returned to Courier"
                        : "Awaiting Resident Collection"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isCollected
                        ? `Collected on ${formatDetailDate(delivery.collectedAt)}`
                        : isReturned
                        ? `Returned on ${formatDetailDate(delivery.returnedAt)}`
                        : "Currently safely stored at security checkpoint booth"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>AMS Ref:</span>
              <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                {delivery.id ? delivery.id.slice(-8).toUpperCase() : "—"}
              </code>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-slate-400 hover:text-slate-700 transition p-1"
                title="Copy reference code"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
