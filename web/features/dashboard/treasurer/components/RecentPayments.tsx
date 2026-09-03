"use client";

import { useQuery } from "@tanstack/react-query";

import { getPayments } from "../services/treasurer.service";
import { formatCurrency, formatDate } from "../utils/format";

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load recent payments.";

export default function RecentPayments() {
  const paymentsQuery = useQuery({
    queryKey: ["treasurer", "payments", "recent"],
    queryFn: () => getPayments({ limit: 8 }),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Recent Payments
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Latest resident payment activity.
      </p>

      <div className="mt-6 overflow-x-auto">
        {paymentsQuery.isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Loading recent payments...
          </p>
        ) : paymentsQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(paymentsQuery.error)}
          </p>
        ) : (paymentsQuery.data ?? []).length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No payments recorded yet.
          </p>
        ) : (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-3 font-medium">Resident</th>
                <th className="pb-3 font-medium">Bill</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody>
              {(paymentsQuery.data ?? []).map((payment) => (
                <tr
                  key={payment._id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-4 font-medium text-slate-900">
                    {payment.residentId}
                  </td>
                  <td className="py-4 text-slate-600">
                    {payment.billId}
                  </td>
                  <td className="py-4 font-medium text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {payment.source}
                    </span>
                  </td>
                  <td className="py-4 text-slate-500">
                    {formatDate(payment.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
