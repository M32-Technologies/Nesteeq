"use client";

import React from "react";
import Link from "next/link";
import {
  Wrench,
  ArrowRight,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";

interface ResidentComplaintsCardProps {
  complaints?: Array<{
    _id: string;
    ticketNumber?: string;
    title: string;
    description: string;
    category: string;
    status: string;
    assignedStaff?: {
      name: string;
      role?: string;
      phone?: string;
    } | null;
    createdAt: string;
  }>;
  isLoading?: boolean;
}

export function ResidentComplaintsCard({
  complaints = [],
  isLoading = false,
}: ResidentComplaintsCardProps) {
  const displayItems = complaints.slice(0, 3).map((c, idx) => ({
    id: c._id || String(idx),
    reqId: c.ticketNumber || `#REQ-${c._id.slice(-4).toUpperCase()}`,
    title: c.title,
    status: (c.status || "PENDING").replace(/_/g, " "),
    statusClass:
      ["RESOLVED", "CLOSED", "APPROVED", "WORK_COMPLETED"].includes((c.status || "").toUpperCase())
        ? "bg-emerald-100 text-emerald-800"
        : ["IN_PROGRESS", "ASSIGNED", "UNDER_REVIEW", "AWAITING_APPROVAL"].includes((c.status || "").toUpperCase())
        ? "bg-blue-100 text-blue-800"
        : ["REJECTED", "CANCELLED"].includes((c.status || "").toUpperCase())
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-800",
    assignedText: "Assigned recently",
    assignedTo: c.assignedStaff?.name || "Facility Technician",
    assignedRole: c.assignedStaff?.role || null,
    staffPhone: c.assignedStaff?.phone || null,
    otp: null,
    note: c.description,
  }));

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-2xs">
            <Wrench className="size-5" />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
              Recent Maintenance & Complaints
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Status of ongoing service tickets and society work
            </p>
          </div>
        </div>

        <Link
          href="/resident/complaints"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition group"
        >
          <span>View All Tickets</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List of Tickets */}
      {displayItems.length > 0 ? (
        <div className="space-y-3 pt-1">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-3 transition-all hover:border-slate-300 hover:bg-white"
            >
              {/* Top Row: Ticket ID + Title + Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-slate-500">
                    {item.reqId}:
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${item.statusClass}`}
                  >
                    {item.status}
                  </span>
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {item.assignedText}
                </span>
              </div>

              {/* Middle Row: Assignee & Description */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Assigned to:</span>
                  <span className="font-bold text-slate-900">{item.assignedTo}</span>
                  {item.assignedRole && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700 border border-amber-200/60">
                      {item.assignedRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Note & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/60 pt-2.5">
                <p className="text-xs text-slate-500 line-clamp-1">
                  {item.note}
                </p>

                {item.staffPhone && (
                  <a
                    href={`tel:${item.staffPhone}`}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
                  >
                    <PhoneCall className="size-3.5 text-indigo-600" />
                    <span>Call Technician</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2">
          <Wrench className="size-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No active maintenance complaints</p>
          <p className="text-[11px] text-slate-400">
            Everything in your flat is running smoothly. Log a request whenever needed.
          </p>
        </div>
      )}
    </div>
  );
}
