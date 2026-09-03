"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { getBills } from "../services/treasurer.service";
import { formatCurrency } from "../utils/format";

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load pending payments.";

export default function PendingPayments() {
  const billsQuery = useQuery({
    queryKey: ["treasurer", "bills", "pending-preview"],
    queryFn: () => getBills(),
  });

  const pendingBills = (billsQuery.data ?? [])
    .filter((bill) => bill.balanceAmount > 0)
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Pending Payments
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Bills with outstanding balances.
      </p>

      <div className="mt-6 space-y-4">
        {billsQuery.isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Loading pending payments...
          </p>
        ) : billsQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(billsQuery.error)}
          </p>
        ) : pendingBills.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No pending payments.
          </p>
        ) : (
          pendingBills.map((bill) => (
            <div
              key={bill._id}
              className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  Resident {bill.residentId}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  Unit {bill.unitId}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(bill.balanceAmount)}
                </p>
                <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  {bill.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href="/treasurer/payments"
        className="mt-5 block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        View All Payments
      </Link>
    </div>
  );
}
