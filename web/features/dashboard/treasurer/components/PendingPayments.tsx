"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ReceiptText,
} from "lucide-react";

import {
  TreasurerPendingDue,
  getTreasurerDashboard,
} from "../services/treasurer.service";
import { formatCurrency, formatDate } from "../utils/format";

interface PendingPaymentsProps {
  pendingDues?: TreasurerPendingDue[];
  isLoading?: boolean;
}

export default function PendingPayments({
  pendingDues: propDues,
  isLoading: propLoading,
}: PendingPaymentsProps) {
  // If not passed via props, fallback to dashboard query
  const dashboardQuery = useQuery({
    queryKey: ["treasurer", "dashboard"],
    queryFn: getTreasurerDashboard,
    enabled: propDues === undefined && propLoading === undefined,
  });

  const isLoading =
    propLoading !== undefined ? propLoading : dashboardQuery.isLoading;
  const pendingBills = propDues ?? dashboardQuery.data?.pendingDues ?? [];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                Pending Dues
              </h3>
              {pendingBills.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-700 border border-amber-200/60">
                  {pendingBills.length} Due
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Unsettled maintenance & assessment bills.
            </p>
          </div>

          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ReceiptText className="size-4" />
          </div>
        </div>

        {/* Content list */}
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-slate-100/80"
                />
              ))}
            </div>
          ) : pendingBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                All Dues Cleared!
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
                There are currently no outstanding resident bills in this cycle.
              </p>
            </div>
          ) : (
            pendingBills.map((bill) => {
              const isOverdue = bill.status === "OVERDUE";

              return (
                <div
                  key={bill._id}
                  className={`group relative flex items-center justify-between rounded-xl border p-3.5 transition hover:shadow-2xs ${
                    isOverdue
                      ? "border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/90"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {bill.flatNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                          isOverdue
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="size-2.5" />}
                        <span>{isOverdue ? "OVERDUE" : "PENDING"}</span>
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock3 className="size-3 text-slate-400" />
                      <span>Due {formatDate(bill.dueDate)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(bill.balanceAmount)}
                    </p>
                    <Link
                      href="/treasurer/billing"
                      className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#07584F] hover:underline"
                    >
                      <span>Collect</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <Link
          href="/treasurer/billing"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-98"
        >
          <span>Manage All Bills</span>
          <ChevronRight className="size-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
