"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  Receipt,
  Wallet,
} from "lucide-react";

import {
  TreasurerRecentPayment,
  getTreasurerDashboard,
} from "../services/treasurer.service";
import { formatCurrency, formatDate } from "../utils/format";

interface RecentPaymentsProps {
  recentPayments?: TreasurerRecentPayment[];
  isLoading?: boolean;
}

export default function RecentPayments({
  recentPayments: propPayments,
  isLoading: propLoading,
}: RecentPaymentsProps) {
  // If not passed via props, fallback to dashboard query
  const dashboardQuery = useQuery({
    queryKey: ["treasurer", "dashboard"],
    queryFn: getTreasurerDashboard,
    enabled: propPayments === undefined && propLoading === undefined,
  });

  const isLoading =
    propLoading !== undefined ? propLoading : dashboardQuery.isLoading;
  const payments = propPayments ?? dashboardQuery.data?.recentPayments ?? [];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              Recent Transactions & Receipts
            </h3>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              Audited
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest resident payments processed via digital wallet and direct bank collections.
          </p>
        </div>

        <Link
          href="/treasurer/payments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07584F] hover:text-[#064C44] transition self-start sm:self-auto"
        >
          <span>View All Transactions</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Table Area */}
      <div className="mt-4 overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-12 w-full animate-pulse rounded-xl bg-slate-100/70"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Receipt className="size-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              No Transactions Recorded Yet
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-[280px]">
              When residents settle bills or add funds to their wallet, payment entries will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Resident / Account</th>
                <th className="pb-3">Receipt / Bill Ref</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right pr-2">Amount Paid</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const shortResident = payment.residentId.slice(-6).toUpperCase();
                const shortBill = payment.billId
                  ? payment.billId.slice(-6).toUpperCase()
                  : "DIRECT";
                const isWallet = payment.source === "WALLET";

                return (
                  <tr
                    key={payment._id}
                    className="group transition-colors hover:bg-slate-50/70"
                  >
                    {/* Resident & Flat Info */}
                    <td className="py-3.5 pl-2 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-xs text-slate-700">
                          {payment.flatNumber.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {payment.flatNumber}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Resident #{shortResident}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Bill Ref */}
                    <td className="py-3.5 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="size-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs">#{shortBill}</span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold border ${
                          isWallet
                            ? "bg-purple-50 text-purple-700 border-purple-200/60"
                            : "bg-blue-50 text-blue-700 border-blue-200/60"
                        }`}
                      >
                        {isWallet ? (
                          <Wallet className="size-3 text-purple-600" />
                        ) : (
                          <CreditCard className="size-3 text-blue-600" />
                        )}
                        <span>{payment.source}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-slate-500 font-medium">
                      {formatDate(payment.paidAt)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 text-right pr-2">
                      <span className="font-black text-sm text-emerald-600 tabular-nums">
                        + {formatCurrency(payment.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span>Showing {payments.length} most recent ledger entries</span>
        </div>

        <Link
          href="/treasurer/payments"
          className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 transition"
        >
          <span>Ledger History</span>
          <ChevronRight className="size-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
