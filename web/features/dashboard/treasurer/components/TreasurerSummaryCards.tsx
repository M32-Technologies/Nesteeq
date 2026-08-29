"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { getFinanceSummary } from "../services/treasurer.service";
import { formatCurrency } from "../utils/format";

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load Treasurer summary.";

export default function TreasurerSummaryCards() {
  const summaryQuery = useQuery({
    queryKey: ["treasurer", "finance-summary"],
    queryFn: getFinanceSummary,
  });

  if (summaryQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (summaryQuery.isError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(summaryQuery.error)}
      </p>
    );
  }

  const summary = summaryQuery.data;
  const summaryItems = [
    {
      title: "Total Collection",
      value: formatCurrency(summary?.totalCollection ?? 0),
      icon: CircleDollarSign,
    },
    {
      title: "Outstanding Dues",
      value: formatCurrency(summary?.totalOutstanding ?? 0),
      icon: ReceiptText,
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(summary?.totalOverdue ?? 0),
      icon: CreditCard,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(summary?.totalExpenses ?? 0),
      icon: WalletCards,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((card) => {
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
  );
}
