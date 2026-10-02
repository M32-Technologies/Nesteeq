import {
  CircleDollarSign,
  Clock3,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { formatCurrency } from "@/features/dashboard/treasurer/utils/format";
import { FinanceSummary } from "../types/payment-history";

interface PaymentHistorySummaryProps {
  summary?: FinanceSummary;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

export default function PaymentHistorySummary({
  summary,
  isLoading,
  isError,
  error,
}: PaymentHistorySummaryProps) {
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load finance summary. {error?.message}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Collected",
      value: summary?.totalCollection ?? 0,
      description: "Payments received",
      icon: CircleDollarSign,
      accent: "bg-[#0F5F45]",
    },
    {
      title: "Outstanding",
      value: summary?.totalOutstanding ?? 0,
      description: "Amount still due",
      icon: WalletCards,
      accent: "bg-slate-500",
    },
    {
      title: "Overdue",
      value: summary?.totalOverdue ?? 0,
      description: "Past due amount",
      icon: Clock3,
      accent: "bg-red-500",
    },
    {
      title: "Late Fees",
      value: summary?.totalLateFees ?? 0,
      description: "Accumulated late fees",
      icon: ReceiptText,
      accent: "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          >
            <div
              className={`absolute bottom-0 left-0 top-0 w-[3px] ${card.accent}`}
            />
            <div className="flex items-center justify-between pl-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>
                <div className="mt-2">
                  {isLoading ? (
                    <div className="h-6 w-20 animate-pulse rounded bg-slate-100" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(card.value, 2)}
                    </p>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>
              <div className="rounded-full bg-slate-50 p-2">
                <Icon className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
