"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CircleDollarSign,
  FileText,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  getFinanceSummary,
  getMonthlyFinance,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  monthLabels,
} from "../../utils/format";

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load reports.";

export default function TreasurerReports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(0);

  const summaryQuery = useQuery({
    queryKey: ["treasurer", "finance-summary"],
    queryFn: getFinanceSummary,
  });
  const monthlyQuery = useQuery({
    queryKey: [
      "treasurer",
      "monthly-finance",
      selectedYear,
      selectedMonth,
    ],
    queryFn: () =>
      getMonthlyFinance({
        year: selectedYear,
        month: selectedMonth || undefined,
      }),
  });

  const rows = monthlyQuery.data?.months ?? [];
  const reportSummary = useMemo(() => {
    const summary = summaryQuery.data;

    return [
      {
        title: "Total Collection",
        value: formatCurrency(summary?.totalCollection ?? 0),
        icon: CircleDollarSign,
      },
      {
        title: "Total Expenses",
        value: formatCurrency(summary?.totalExpenses ?? 0),
        icon: ReceiptText,
      },
      {
        title: "Outstanding Dues",
        value: formatCurrency(summary?.totalOutstanding ?? 0),
        icon: FileText,
      },
      {
        title: "Current Balance",
        value: formatCurrency(summary?.currentBalance ?? 0),
        icon: TrendingUp,
      },
    ];
  }, [summaryQuery.data]);

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("No report rows available to export.");
      return;
    }

    const header = [
      "Month",
      "Year",
      "Collection",
      "Expenses",
      "Outstanding",
      "Late Fees",
      "Balance",
    ];
    const csvRows = rows.map((row) => [
      monthLabels[row.month - 1],
      row.year,
      row.collection,
      row.expenses,
      row.outstanding,
      row.lateFees,
      row.balance,
    ]);
    const csv = [header, ...csvRows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `treasurer-report-${selectedYear}${
      selectedMonth ? `-${selectedMonth}` : ""
    }.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Financial Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review apartment collections, expenses, dues, late fees and
          balances.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportSummary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value}
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

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Financial Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filtered by payment date, expense date and bill due date.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(Number(event.target.value))
              }
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value={0}>All months</option>
              {monthLabels.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2000"
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(Number(event.target.value))
              }
              className="w-28 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-6">
          {summaryQuery.isLoading || monthlyQuery.isLoading ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Loading reports...
            </p>
          ) : summaryQuery.isError || monthlyQuery.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getSafeErrorMessage(
                summaryQuery.error ?? monthlyQuery.error,
              )}
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No report data is available for the selected filter.
            </p>
          ) : (
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Month</th>
                  <th className="pb-3 font-medium">Collection</th>
                  <th className="pb-3 font-medium">Expenses</th>
                  <th className="pb-3 font-medium">Outstanding</th>
                  <th className="pb-3 font-medium">Late Fees</th>
                  <th className="pb-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((report) => (
                  <tr
                    key={`${report.year}-${report.month}`}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-4 font-medium text-slate-900">
                      {monthLabels[report.month - 1]} {report.year}
                    </td>
                    <td className="py-4 font-medium text-emerald-700">
                      {formatCurrency(report.collection)}
                    </td>
                    <td className="py-4 text-slate-600">
                      {formatCurrency(report.expenses)}
                    </td>
                    <td className="py-4 text-amber-700">
                      {formatCurrency(report.outstanding)}
                    </td>
                    <td className="py-4 text-red-700">
                      {formatCurrency(report.lateFees)}
                    </td>
                    <td className="py-4 font-semibold text-slate-900">
                      {formatCurrency(report.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
