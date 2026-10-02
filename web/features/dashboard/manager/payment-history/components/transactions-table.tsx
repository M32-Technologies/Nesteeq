import { ChevronDown, Eye, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/features/dashboard/treasurer/utils/format";
import { Payment, PaymentSourceFilter } from "../types/payment-history";

const sourceLabels: Record<NonNullable<PaymentSourceFilter>, string> = {
  ALL: "All Sources",
  MANUAL: "Manual",
  WALLET: "Wallet",
};

const getSourceBadgeClass = (source: string) => {
  if (source === "WALLET") {
    return "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700";
  }
  return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
};

interface TransactionsTableProps {
  payments: Payment[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sourceFilter: PaymentSourceFilter;
  onSourceFilterChange: (source: PaymentSourceFilter) => void;
  onViewDetails: (payment: Payment) => void;
  resolveResidentName: (id: string) => string;
  resolveFlatNumber: (id: string) => string;
}

export default function TransactionsTable({
  payments,
  isLoading,
  isError,
  error,
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  onViewDetails,
  resolveResidentName,
  resolveFlatNumber,
}: TransactionsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search resident, flat, or bill..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>
          <div className="relative w-full lg:w-[180px]">
            <select
              value={sourceFilter}
              onChange={(e) =>
                onSourceFilterChange(e.target.value as PaymentSourceFilter)
              }
              className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            >
              {Object.entries(sourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-900" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            Failed to load transactions. {error?.message}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              No payment history found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || sourceFilter !== "ALL"
                ? "Try changing your search or filters."
                : "Payment activity will appear here when transactions are recorded."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Resident</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Flat / Unit</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bill</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr
                  key={payment._id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4 align-middle text-sm text-slate-600">
                    {formatDate(payment.paidAt)}
                  </td>
                  <td className="px-4 py-4 align-middle font-medium text-slate-900">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {resolveResidentName(payment.residentId)}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm text-slate-600">
                    {resolveFlatNumber(payment.unitId)}
                  </td>
                  <td className="px-4 py-4 align-middle text-sm text-slate-500">
                    #{payment.billId.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-4 align-middle text-sm font-medium text-slate-900">
                    {formatCurrency(payment.amount, 2)}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className={`inline-flex ${getSourceBadgeClass(payment.source)}`}>
                      {payment.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onViewDetails(payment)}
                      className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                      aria-label="View transaction details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-sm font-medium text-slate-500">
          {payments.length} {sourceFilter === "ALL" ? "total" : sourceFilter.toLowerCase()} transactions
        </p>
      </div>
    </div>
  );
}
