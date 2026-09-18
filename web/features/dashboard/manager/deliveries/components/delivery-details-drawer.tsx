"use client"

import {
  Calendar,
  Clock,
  Home,
  Package,
  Phone,
  Truck,
  User,
  X,
} from "lucide-react"
import type { DeliveryRecord } from "../types/deliveries"

interface DeliveryDetailsDrawerProps {
  delivery: DeliveryRecord | null
  open: boolean
  onClose: () => void
}

const statusBadgeStyles: Record<string, string> = {
  WAITING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  NOTIFIED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  COLLECTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  RETURNED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
}

const statusLabels: Record<string, string> = {
  WAITING: "Pending (At Gate)",
  NOTIFIED: "Pending (Notified)",
  COLLECTED: "Collected by Resident",
  RETURNED: "Returned to Courier",
}

export default function DeliveryDetailsDrawer({
  delivery,
  open,
  onClose,
}: DeliveryDetailsDrawerProps) {
  if (!open || !delivery) return null

  const formatTimestamp = (timeStr?: string | null) => {
    if (!timeStr) return "—"
    try {
      const d = new Date(timeStr)
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return timeStr
    }
  }

  const badgeClass =
    statusBadgeStyles[delivery.status] || statusBadgeStyles.WAITING
  const statusLabel = statusLabels[delivery.status] || "Pending"

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl">
          <div className="flex h-full flex-col divide-y divide-slate-100">
            {/* Drawer Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      {delivery.deliveryCompany} • {delivery.flatNumber}
                    </h2>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Received on {formatTimestamp(delivery.receivedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Recipient Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recipient Information
                </h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Home size={14} className="text-slate-400" />
                      Flat / Unit
                    </span>
                    <span className="font-bold text-slate-900">
                      {delivery.flatNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <User size={14} className="text-slate-400" />
                      Resident Name
                    </span>
                    <span className="font-semibold text-slate-800">
                      {delivery.residentName || "—"}
                    </span>
                  </div>
                  {delivery.residentPhone && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Phone size={14} className="text-slate-400" />
                        Phone
                      </span>
                      <span className="text-slate-700">
                        {delivery.residentPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Package & Courier Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Courier & Package
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Truck size={14} className="text-slate-400" />
                      Courier / Company
                    </span>
                    <span className="font-semibold text-slate-900">
                      {delivery.deliveryCompany}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Package size={14} className="text-slate-400" />
                      Package Type
                    </span>
                    <span className="capitalize text-slate-700">
                      {delivery.deliveryType.toLowerCase()}
                    </span>
                  </div>
                  {delivery.deliveryPersonName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Delivery Person</span>
                      <span className="text-slate-700">
                        {delivery.deliveryPersonName}{" "}
                        {delivery.deliveryPersonPhone
                          ? `(${delivery.deliveryPersonPhone})`
                          : ""}
                      </span>
                    </div>
                  )}
                  {delivery.packageDescription && (
                    <div>
                      <span className="text-slate-500">Description:</span>
                      <p className="mt-1 rounded-md bg-slate-50 p-2 text-slate-700">
                        {delivery.packageDescription}
                      </p>
                    </div>
                  )}
                  {delivery.notes && (
                    <div>
                      <span className="text-slate-500">Notes:</span>
                      <p className="mt-1 rounded-md bg-slate-50 p-2 text-slate-700">
                        {delivery.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Event Timeline
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Clock size={15} className="mt-0.5 text-[#0F5F45]" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Received at Gate
                      </p>
                      <p className="text-slate-500">
                        {formatTimestamp(delivery.receivedAt)}
                      </p>
                    </div>
                  </div>

                  {delivery.notifiedAt && (
                    <div className="flex items-start gap-2.5 border-t border-slate-100 pt-2.5">
                      <Calendar size={15} className="mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Resident Notified
                        </p>
                        <p className="text-slate-500">
                          {formatTimestamp(delivery.notifiedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {delivery.collectedAt && (
                    <div className="flex items-start gap-2.5 border-t border-slate-100 pt-2.5">
                      <Package size={15} className="mt-0.5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Collected by Resident
                        </p>
                        <p className="text-slate-500">
                          {formatTimestamp(delivery.collectedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {delivery.returnedAt && (
                    <div className="flex items-start gap-2.5 border-t border-slate-100 pt-2.5">
                      <Package size={15} className="mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Returned to Courier
                        </p>
                        <p className="text-slate-500">
                          {formatTimestamp(delivery.returnedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
