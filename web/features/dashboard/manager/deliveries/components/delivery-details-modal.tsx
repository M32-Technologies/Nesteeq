"use client"

import {
  Building2,
  Clock,
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

const statusBadgeStyles: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  WAITING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200/70",
    label: "Pending Pickup",
  },
  NOTIFIED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200/70",
    label: "Pending Pickup (Notified)",
  },
  COLLECTED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200/70",
    label: "Collected",
  },
  RETURNED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200/70",
    label: "Returned to Courier",
  },
}

function formatDetailDate(dateStr?: string | null) {
  if (!dateStr) return "Not recorded"
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
  if (!open || !delivery) return null

  const statusConfig =
    statusBadgeStyles[delivery.status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      ring: "ring-slate-200",
      label: delivery.status,
    }

  const isCollected = delivery.status === "COLLECTED"
  const isReturned = delivery.status === "RETURNED"

  return (
    <Portal>
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F5F45]/10 text-[#0F5F45]">
                  <Package size={17} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">
                    {delivery.deliveryCompany} • {delivery.flatNumber}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.ring}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="text-xs font-medium text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      Type: {delivery.deliveryType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
            {/* Resident & Apartment Section */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Building2 size={13} />
                Destination & Resident
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Flat / Unit</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {delivery.flatNumber || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Resident Name</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {delivery.residentName || "Direct to Flat"}
                  </span>
                  {delivery.residentPhone && (
                    <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {delivery.residentPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Courier Information Section */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Truck size={13} />
                Courier Logistics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Carrier / Company</span>
                  <span className="font-semibold text-slate-900">
                    {delivery.deliveryCompany || "Independent"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Delivery Agent</span>
                  <span className="font-semibold text-slate-900">
                    {delivery.deliveryPersonName || "Not Recorded"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Agent Contact</span>
                  <span className="font-semibold text-slate-900">
                    {delivery.deliveryPersonPhone || "—"}
                  </span>
                </div>
              </div>

              {delivery.packageDescription && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block text-[11px]">Package Description</span>
                  <p className="text-slate-700 mt-0.5">{delivery.packageDescription}</p>
                </div>
              )}

              {delivery.notes && (
                <div className="mt-2 text-xs bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-amber-800">
                  <span className="font-semibold block text-[11px]">Gate Notes:</span>
                  <p className="mt-0.5">{delivery.notes}</p>
                </div>
              )}
            </div>

            {/* Parcel Lifecycle Timeline */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Clock size={13} />
                Audit Trail & Gate Timeline
              </h4>

              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {/* 1. Received */}
                <div className="relative">
                  <span className="absolute -left-5 top-0.5 flex size-3 items-center justify-center rounded-full bg-[#0F5F45] ring-4 ring-white" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Received at Security Desk
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDetailDate(delivery.receivedAt)}
                    </p>
                    {delivery.receivedBy && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Logged by staff ID: {delivery.receivedBy.toString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Notified */}
                <div className="relative">
                  <span
                    className={`absolute -left-5 top-0.5 flex size-3 items-center justify-center rounded-full ring-4 ring-white ${
                      delivery.notifiedAt ? "bg-[#0F5F45]" : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Resident Notification
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {delivery.notifiedAt
                        ? `Notification sent on ${formatDetailDate(delivery.notifiedAt)}`
                        : "Awaiting notification dispatch"}
                    </p>
                  </div>
                </div>

                {/* 3. Final State: Collected or Returned */}
                {isReturned ? (
                  <div className="relative">
                    <span className="absolute -left-5 top-0.5 flex size-3 items-center justify-center rounded-full bg-rose-500 ring-4 ring-white" />
                    <div>
                      <p className="text-xs font-bold text-rose-700">
                        Returned to Courier
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDetailDate(delivery.returnedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span
                      className={`absolute -left-5 top-0.5 flex size-3 items-center justify-center rounded-full ring-4 ring-white ${
                        isCollected ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isCollected ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {isCollected ? "Collected by Resident" : "Pending Collection"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isCollected
                          ? formatDetailDate(delivery.collectedAt)
                          : "Resident has not yet picked up from security desk"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-xs text-slate-500">
              AMS Delivery ID:{" "}
              <code className="text-slate-700 font-mono text-[11px]">
                {delivery.id ? delivery.id.slice(-8) : "—"}
              </code>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
