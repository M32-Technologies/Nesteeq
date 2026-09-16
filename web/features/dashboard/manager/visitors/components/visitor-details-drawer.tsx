"use client"

import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Home,
  Phone,
  QrCode,
  ShieldCheck,
  User,
  X,
} from "lucide-react"

import type { VisitorRecord, VisitorStatus } from "../types/visitors"

interface VisitorDetailsDrawerProps {
  visitor: VisitorRecord | null
  open: boolean
  onClose: () => void
}

const statusBadgeStyles: Record<VisitorStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  EXPECTED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  CHECKED_OUT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  DENIED: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
}

const statusLabels: Record<VisitorStatus, string> = {
  ACTIVE: "Currently Inside",
  EXPECTED: "Expected / Pass Active",
  CHECKED_OUT: "Checked Out",
  DENIED: "Denied Entry",
}

export default function VisitorDetailsDrawer({
  visitor,
  open,
  onClose,
}: VisitorDetailsDrawerProps) {
  if (!open || !visitor) return null

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—"
    const date = new Date(timeStr)
    return Number.isNaN(date.getTime()) ? timeStr : date.toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Visitor Details
              </h2>
              <p className="text-xs text-slate-500">
                Gate log reference #{visitor.id.slice(-6).toUpperCase()}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="space-y-6 overflow-y-auto p-6 text-sm">
            {/* Main Profile Info */}
            <div className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F4EE] text-base font-semibold text-[#0F5F45]">
                {visitor.visitorName.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-slate-900">
                    {visitor.visitorName}
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[visitor.status]}`}
                  >
                    {statusLabels[visitor.status]}
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                  <Phone size={13} className="text-slate-400" />
                  {visitor.visitorPhone || "No phone provided"}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                  <QrCode size={13} className="text-slate-400" />
                  {visitor.entryType === "PASS"
                    ? "Pre-approved digital pass"
                    : "Manual gate entry log"}
                </p>
              </div>
            </div>

            {/* Visit Details */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Destination & Host
              </h4>

              <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Home size={15} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Flat / Unit</p>
                    <p className="font-semibold text-slate-900">
                      {visitor.flatNumber || "Unit not assigned"}
                    </p>
                  </div>
                </div>

                {visitor.residentName && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <User size={15} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Host Resident</p>
                      <p className="font-medium text-slate-800">
                        {visitor.residentName}
                        {visitor.residentPhone ? ` (${visitor.residentPhone})` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Purpose of Visit</p>
                    <p className="font-medium text-slate-800">
                      {visitor.purpose || "Personal visit"}
                    </p>
                  </div>
                </div>

                {visitor.vehicleNumber && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Car size={15} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Vehicle Number</p>
                      <p className="font-medium text-slate-800">
                        {visitor.vehicleNumber}
                        {visitor.vehicleType ? ` (${visitor.vehicleType})` : ""}
                      </p>
                    </div>
                  </div>
                )}

                {visitor.parkingSlotNumber && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Car size={15} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Assigned Parking Slot</p>
                      <p className="font-medium text-slate-800">
                        Slot #{visitor.parkingSlotNumber}
                        {visitor.parkingAssignmentStatus
                          ? ` (${visitor.parkingAssignmentStatus})`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gate Entry & Timeline
              </h4>

              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    Expected Arrival:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatTime(visitor.expectedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Check-in Time:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatTime(visitor.checkedInAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    Check-out Time:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatTime(visitor.checkedOutAt)}
                  </span>
                </div>
              </div>
            </div>

            {visitor.notes && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notes
                </h4>
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {visitor.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
