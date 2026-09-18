"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Receipt,
  FileCheck2,
  Calendar,
} from "lucide-react";

export function ResidentDuesCard() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
            <FileCheck2 className="size-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
              Verified Ownership & Dues Summary
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Monthly society maintenance breakdown
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/70 shadow-2xs">
          <CheckCircle2 className="size-3 text-emerald-600" />
          <span>No Penalty</span>
        </span>
      </div>

      {/* Charges Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-2.5 text-xs sm:text-[13px]">
        <div className="flex items-center justify-between text-slate-600 font-medium">
          <span>Society Maintenance (₹1.14 / sq.ft • 1,840 sq.ft)</span>
          <span className="font-bold text-slate-900">₹2,100.00</span>
        </div>

        <div className="flex items-center justify-between text-slate-600 font-medium">
          <span>Sinking & Repair Reserve Fund</span>
          <span className="font-bold text-slate-900">₹400.00</span>
        </div>

        <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between">
          <span className="font-bold text-slate-900">Total Payable</span>
          <span className="text-lg sm:text-xl font-black text-indigo-600">
            ₹2,500.00
          </span>
        </div>
      </div>

      {/* Footer Info & Instant Pay CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Last paid:</span>
          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/70">
            ₹2,500 on Aug 24 (via UPI)
          </span>
        </div>

        <Link
          href="/resident/bills"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 cursor-pointer"
        >
          <CreditCard className="size-3.5" />
          <span>Pay ₹2,500 Instantly</span>
        </Link>
      </div>
    </div>
  );
}
