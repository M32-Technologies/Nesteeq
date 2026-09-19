"use client";

import React from "react";
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
} from "lucide-react";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";

export function ResidentBillsPage() {
  const { apartmentName, flatUnitName } = useResidentDashboard();

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Bills & Society Finance
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Review monthly maintenance invoices and payment receipts for {flatUnitName} at {apartmentName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("No outstanding dues to pay at this time.")}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <CreditCard className="size-4" />
          <span>Pay Dues (₹0.00)</span>
        </button>
      </div>

      {/* Current Outstanding Card */}
      <div className="rounded-lg border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase text-[#637083]">
              Current Statement Status
            </span>
            <h3 className="text-2xl font-semibold text-[#111111] mt-1">
              ₹0.00
            </h3>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              <span>All society maintenance dues are currently cleared for {flatUnitName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Compliant & Active</span>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-[#637083]">
            <span>Apartment Society</span>
            <span className="font-semibold text-[#111111]">{apartmentName}</span>
          </div>
          <div className="flex justify-between text-[#637083]">
            <span>Assigned Unit</span>
            <span className="font-semibold text-[#111111]">{flatUnitName}</span>
          </div>
          <div className="flex justify-between text-[#637083]">
            <span>Billing Cycle</span>
            <span className="font-semibold text-[#111111]">1st - 5th of every month</span>
          </div>
          <div className="flex justify-between text-[#637083]">
            <span>Late Payment Penalty</span>
            <span className="font-semibold text-emerald-700">₹0.00 (Zero overdue)</span>
          </div>
        </div>
      </div>

      {/* Payment History Table Placeholder */}
      <div className="rounded-lg border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111111]">
            Recent Invoices & Receipts
          </h2>
          <span className="text-xs text-[#637083]">Auto-reconciled with Society Bank Desk</span>
        </div>

        <div className="rounded-lg border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-8 text-center space-y-2">
          <CheckCircle2 className="size-6 text-[#7C8782] mx-auto" />
          <p className="text-sm font-semibold text-[#111111]">
            Zero Pending Invoices
          </p>
          <p className="text-xs text-[#637083] max-w-sm mx-auto">
            Whenever your society administrator generates a monthly maintenance or water billing cycle, it will appear here with instant online payment options.
          </p>
        </div>
      </div>
    </div>
  );
}
