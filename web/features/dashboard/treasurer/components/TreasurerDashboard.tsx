"use client";

import {
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  WalletCards,
} from "lucide-react";

const summaryCards = [
  {
    title: "Total Collection",
    value: "₹0",
    icon: CircleDollarSign,
  },
  {
    title: "Outstanding Dues",
    value: "₹0",
    icon: ReceiptText,
  },
  {
    title: "Overdue Amount",
    value: "₹0",
    icon: CreditCard,
  },
  {
    title: "Monthly Expenses",
    value: "₹0",
    icon: WalletCards,
  },
];

export default function TreasurerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Treasurer Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage collections, dues, expenses and apartment finances.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-3">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Collection Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monthly collection and expense trends will appear here.
          </p>

          <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
            Finance chart
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Payments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Payments requiring attention.
          </p>

          <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
            No pending payments
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Payments
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest resident payment activity.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-3 font-medium">Resident</th>
                <th className="pb-3 font-medium">Bill</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-400"
                >
                  No recent payments
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}