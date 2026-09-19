"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  ReceiptText,
  LifeBuoy,
  Users2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

interface ResidentMetricsBarProps {
  unitNumber?: string;
  activeComplaintsCount: number;
  activeVisitorsCount: number;
  latestComplaintTitle?: string;
  latestVisitorName?: string;
}

export function ResidentMetricsBar({
  unitNumber = "Assigned Flat",
  activeComplaintsCount = 0,
  activeVisitorsCount = 0,
  latestComplaintTitle,
  latestVisitorName,
}: ResidentMetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. MY FLAT */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              MY FLAT
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Home className="size-4" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
            {unitNumber}
          </h3>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            Active Society Resident Membership
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/70">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            <span>All Compliances Verified</span>
          </span>
        </div>
      </div>

      {/* 2. MAINTENANCE DUE */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              MAINTENANCE DUE
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ReceiptText className="size-4" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
            ₹0
          </h3>

          <p className="mt-1 text-xs text-emerald-700 font-semibold">
            All dues cleared for current cycle
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/resident/bills"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 transition group-hover:translate-x-0.5"
          >
            <span>Statement</span>
            <ChevronRight className="size-3.5" />
          </Link>
          <span className="text-[11px] font-semibold text-emerald-600">
            No Dues
          </span>
        </div>
      </div>

      {/* 3. COMPLAINTS / HELPDESK */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              COMPLAINTS / HELPDESK
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <LifeBuoy className="size-4" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
            {activeComplaintsCount}{" "}
            <span className="text-sm font-bold text-slate-600">Active</span>
          </h3>

          <p className="mt-1 text-xs text-slate-500 font-medium truncate">
            {latestComplaintTitle
              ? latestComplaintTitle
              : activeComplaintsCount > 0
              ? `${activeComplaintsCount} tickets in progress`
              : "All service requests cleared"}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link
            href="/resident/complaints"
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200/70 hover:bg-purple-100 transition"
          >
            <span className="size-1.5 rounded-full bg-purple-600" />
            <span>
              {activeComplaintsCount > 0
                ? "Review Active Tickets"
                : "No Pending Issues"}
            </span>
          </Link>
        </div>
      </div>

      {/* 4. EXPECTED VISITORS */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              EXPECTED VISITORS
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users2 className="size-4" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
            {activeVisitorsCount}{" "}
            <span className="text-sm font-bold text-slate-600">
              Active Passes
            </span>
          </h3>

          <p className="mt-1 text-xs text-slate-500 font-medium truncate">
            {latestVisitorName
              ? `${latestVisitorName} • Pre-authorized pass`
              : activeVisitorsCount > 0
              ? `${activeVisitorsCount} passes valid today`
              : "No upcoming visitors logged"}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link
            href="/resident/visitors"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100 transition"
          >
            <span className="size-1.5 rounded-full bg-emerald-600" />
            <span>Manage Gate Passes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
