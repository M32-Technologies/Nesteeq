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
  // Use real backend complaints if present, otherwise fallback to the high-detail defaults from design mockup
  const displayItems =
    complaints.length > 0
      ? complaints.slice(0, 2).map((c, idx) => ({
          id: c._id || String(idx),
          reqId: c.ticketNumber || `#REQ-${c._id.slice(-4).toUpperCase()}`,
          title: c.title,
          status: c.status.replace("_", " "),
          statusClass:
            c.status === "IN_PROGRESS" || c.status === "ASSIGNED"
              ? "bg-amber-100 text-amber-800"
              : c.status === "RESOLVED"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-blue-100 text-blue-800",
          assignedText: "Assigned recently",
          assignedTo: c.assignedStaff?.name || "Facility Technician",
          assignedRole: c.assignedStaff?.role || "Plumber • ★ 4.9",
          staffPhone: c.assignedStaff?.phone || "+91 98765 43210",
          otp: "5819",
          note: c.description,
        }))
      : [
          {
            id: "1",
            reqId: "#REQ-8831",
            title: "Kitchen Sink Pipe Leakage",
            status: "In Progress",
            statusClass: "bg-amber-100 text-amber-800",
            assignedText: "Assigned 2h ago",
            assignedTo: "Ramesh Patel",
            assignedRole: "Facility Plumber • ★ 4.9",
            staffPhone: "+91 98765 43210",
            otp: "5819",
            note: "Plumber on way to inspect main drainage seal.",
          },
          {
            id: "2",
            reqId: "#REQ-8794",
            title: "Elevator B2 Call Button Lag",
            status: "Under Review",
            statusClass: "bg-blue-100 text-blue-800",
            assignedText: "Yesterday",
            assignedTo: "Otis Technical Support",
            assignedRole: "Elevator AMC Partner",
            staffPhone: "+91 98765 00000",
            otp: null,
            note: "Escalated to Otis Maintenance Vendor. Expected resolution by Sep 24, 6:00 PM.",
          },
        ];

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
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700 border border-amber-200/60">
                  {item.assignedRole}
                </span>
              </div>

              {item.otp && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200">
                  <KeyRound className="size-3 text-amber-600" />
                  <span>Work Completion OTP:</span>
                  <span className="font-mono text-amber-700 tracking-wider font-extrabold">
                    {item.otp}
                  </span>
                </div>
              )}
            </div>

            {/* Note & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/60 pt-2.5">
              <p className="text-xs text-slate-500 line-clamp-1">
                {item.note}
              </p>

              <a
                href={`tel:${item.staffPhone}`}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
              >
                <PhoneCall className="size-3.5 text-indigo-600" />
                <span>Call Technician</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
