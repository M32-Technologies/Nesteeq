"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  QrCode,
  LifeBuoy,
  CreditCard,
  PhoneCall,
  CalendarCheck2,
  Bell,
  Sparkles,
} from "lucide-react";

interface ResidentQuickActionsProps {
  onOpenVisitorPassModal?: () => void;
  onOpenComplaintModal?: () => void;
}

export function ResidentQuickActions({
  onOpenVisitorPassModal,
  onOpenComplaintModal,
}: ResidentQuickActionsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs lg:flex-row lg:items-center lg:justify-between">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 pl-1">
        QUICK ACTIONS
      </span>

      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* + Visitor Pass QR */}
        <Link
          href="/resident/visitors"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <QrCode className="size-3.5" />
          <span>Visitor Pass QR</span>
        </Link>

        {/* + Log Complaint */}
        <Link
          href="/resident/complaints"
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 transition active:scale-95 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <LifeBuoy className="size-3.5 text-purple-600" />
          <span>Log Complaint</span>
        </Link>

        {/* Pay Dues (₹2,500) */}
        <Link
          href="/resident/bills"
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition active:scale-95 cursor-pointer"
        >
          <CreditCard className="size-3.5 text-amber-600" />
          <span>Pay Dues (₹2,500)</span>
        </Link>

        {/* Gate Intercom / Emergency */}
        <Link
          href="/resident/alerts"
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 transition active:scale-95 cursor-pointer"
        >
          <PhoneCall className="size-3.5 text-blue-600" />
          <span>Gate Intercom</span>
        </Link>

        {/* Notice Board */}
        <Link
          href="/resident/announcements"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition active:scale-95 cursor-pointer"
        >
          <Bell className="size-3.5 text-slate-600" />
          <span>Notice Board</span>
        </Link>
      </div>
    </div>
  );
}
