"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileText,
  Filter,
  PieChart,
  Printer,
  ReceiptText,
  Search,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getFinanceSummary,
  getMonthlyFinance,
  getDefaultersReport,
  getExpenseBreakdownReport,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
  monthLabels,
} from "../../utils/format";

type ReportTab = "summary" | "defaulters" | "expenses";
type OverdueFilter = "ALL" | "30" | "60" | "90";

const ITEMS_PER_PAGE = 8;

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load reports.";

const categoryLabels: Record<string, string> = {
  MAINTENANCE: "General Maintenance",
  ELECTRICITY: "Electricity / Power",
  WATER: "Water Supply",
  SECURITY: "Security Services",
  CLEANING: "Cleaning & Housekeeping",
  REPAIR: "Repairs & Civil Works",
  SALARY: "Staff Salary & Wages",
  OTHER: "Miscellaneous Expenses",
};

const getOverdueBadgeClass = (days: number) => {
  if (days >= 90) return "bg-red-50 text-red-700 border-red-200 font-semibold";
  if (days >= 60) return "bg-rose-50 text-rose-700 border-rose-200 font-medium";
  if (days >= 30) return "bg-amber-50 text-amber-700 border-amber-200 font-medium";
  return "bg-yellow-50 text-yellow-800 border-yellow-200";
};

export default function TreasurerReports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");

  // Defaulters Filter & Search States
  const [defaulterSearch, setDefaulterSearch] = useState("");
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>("ALL");
  const [defaultersPage, setDefaultersPage] = useState(1);

  // 1. Finance Queries (Existing)
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

  // 2. Defaulters Report Query (Server-side computed aging, search, and pagination)
  const daysParam = overdueFilter === "ALL" ? undefined : Number(overdueFilter);
  const defaultersQuery = useQuery({
    queryKey: [
      "treasurer",
      "reports",
      "defaulters",
      daysParam,
      defaulterSearch,
      defaultersPage,
    ],
    queryFn: () =>
      getDefaultersReport({
        days: daysParam,
        search: defaulterSearch.trim() || undefined,
        page: defaultersPage,
        limit: ITEMS_PER_PAGE,
      }),
  });

  // 3. Expense Breakdown Report Query (Server-side category aggregation and percentages)
  const { startDate, endDate } = useMemo(() => {
    if (selectedMonth !== 0) {
      const start = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)).toISOString();
      const end = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999)).toISOString();
      return { startDate: start, endDate: end };
    }
    const start = new Date(Date.UTC(selectedYear, 0, 1)).toISOString();
    const end = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999)).toISOString();
    return { startDate: start, endDate: end };
  }, [selectedYear, selectedMonth]);

  const expenseBreakdownQuery = useQuery({
    queryKey: [
      "treasurer",
      "reports",
      "expense-breakdown",
      startDate,
      endDate,
    ],
    queryFn: () => getExpenseBreakdownReport({ startDate, endDate }),
  });

  const rows = monthlyQuery.data?.months ?? [];

  // Summary Metrics
  const reportSummary = useMemo(() => {
    const summary = summaryQuery.data;

    return [
      {
        title: "Total Collection",
        value: formatCurrency(summary?.totalCollection ?? 0),
        icon: CircleDollarSign,
        accent: "from-emerald-500 to-teal-600",
        subtext: "All recorded collections",
      },
      {
        title: "Total Expenses",
        value: formatCurrency(summary?.totalExpenses ?? 0),
        icon: ReceiptText,
        accent: "from-rose-500 to-red-600",
        subtext: "Approved & paid expenses",
      },
      {
        title: "Outstanding Dues",
        value: formatCurrency(summary?.totalOutstanding ?? 0),
        icon: FileText,
        accent: "from-amber-500 to-orange-600",
        subtext: `${summary?.totalOverdue ? formatCurrency(summary.totalOverdue) + " overdue" : "Pending collections"}`,
      },
      {
        title: "Current Balance",
        value: formatCurrency(summary?.currentBalance ?? 0),
        icon: TrendingUp,
        accent: "from-violet-500 to-indigo-600",
        subtext: "Net treasury surplus",
      },
    ];
  }, [summaryQuery.data]);

  // Annual Totals calculation for Financial Summary table
  const annualTotals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        collection: acc.collection + row.collection,
        expenses: acc.expenses + row.expenses,
        outstanding: acc.outstanding + row.outstanding,
        lateFees: acc.lateFees + row.lateFees,
        balance: acc.balance + row.balance,
      }),
      { collection: 0, expenses: 0, outstanding: 0, lateFees: 0, balance: 0 }
    );
  }, [rows]);

  const defaulterData = defaultersQuery.data;
  const paginatedDefaulters = defaulterData?.defaulters ?? [];
  const totalDefaulterPages = defaulterData?.pagination?.pages || 1;
  const totalDefaultersAmount = defaulterData?.totalOverdueAmount ?? 0;
  const totalDefaultersCount = defaulterData?.defaulterCount ?? defaulterData?.pagination?.total ?? 0;

  const expenseBreakdownData = expenseBreakdownQuery.data;
  const expenseCategoryBreakdown = useMemo(() => {
    return (expenseBreakdownData?.categories ?? []).map((cat) => ({
      category: cat.category,
      total: cat.totalAmount,
      count: cat.count,
      percentage: cat.percentage,
    }));
  }, [expenseBreakdownData]);

  const totalFilteredExpenseAmount = expenseBreakdownData?.totalApprovedAmount ?? 0;

  // CSV Export
  const exportCsv = () => {
    let header: string[] = [];
    let csvRows: (string | number)[][] = [];
    let filename = "";

    if (activeTab === "summary") {
      if (rows.length === 0) {
        toast.error("No report rows available to export.");
        return;
      }
      header = [
        "Month",
        "Year",
        "Collection",
        "Expenses",
        "Outstanding",
        "Late Fees",
        "Balance",
      ];
      csvRows = rows.map((row) => [
        monthLabels[row.month - 1],
        row.year,
        row.collection,
        row.expenses,
        row.outstanding,
        row.lateFees,
        row.balance,
      ]);
      filename = `financial-summary-${selectedYear}${
        selectedMonth ? `-${selectedMonth}` : ""
      }.csv`;
    } else if (activeTab === "defaulters") {
      if (paginatedDefaulters.length === 0) {
        toast.error("No defaulters data available to export.");
        return;
      }
      header = [
        "Flat",
        "Resident",
        "Due Amount (INR)",
        "Due Date",
        "Overdue Days",
        "Status",
      ];
      csvRows = paginatedDefaulters.map((d) => [
        d.flatNumber ? `Flat ${d.flatNumber}` : d.unitName || "N/A",
        d.residentName || "Resident",
        d.balanceAmount,
        d.dueDate ? d.dueDate.slice(0, 10) : "N/A",
        d.overdueDays,
        d.status,
      ]);
      filename = `defaulters-report-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (activeTab === "expenses") {
      if (expenseCategoryBreakdown.length === 0) {
        toast.error("No expense category data available to export.");
        return;
      }
      header = ["Category", "Amount (INR)", "Expense Count", "Share (%)"];
      csvRows = expenseCategoryBreakdown.map((c) => [
        categoryLabels[c.category] || c.category,
        c.total,
        c.count,
        `${c.percentage.toFixed(1)}%`,
      ]);
      filename = `expense-breakdown-${selectedYear}${
        selectedMonth ? `-${selectedMonth}` : ""
      }.csv`;
    }

    const csv = [header, ...csvRows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Report CSV exported successfully.");
  };

  // Print / PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Print-Only Society Header */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Nesteeq Apartment ERP</h1>
            <p className="text-xs text-slate-500">Official Treasurer Financial Statement</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Report: {activeTab === "summary" ? "Financial Summary" : activeTab === "defaulters" ? "Defaulters Report" : "Expense Breakdown"}</p>
            <p>Period: {selectedMonth ? `${monthLabels[selectedMonth - 1]} ` : ""}{selectedYear}</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Page Header (Screen Only) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive audit reports, monthly collections, defaulters tracking, and expense breakdown.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportSummary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.subtext}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col border-b border-slate-200 px-5 pt-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === "summary"
                  ? "border-[#07584F] text-[#07584F]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Financial Summary
              {rows.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {rows.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("defaulters");
                setDefaultersPage(1);
              }}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === "defaulters"
                  ? "border-[#07584F] text-[#07584F]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="h-4 w-4" />
              Defaulters Report
              {totalDefaultersCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {totalDefaultersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("expenses")}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === "expenses"
                  ? "border-[#07584F] text-[#07584F]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <PieChart className="h-4 w-4" />
              Expense Breakdown
              {expenseCategoryBreakdown.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {expenseCategoryBreakdown.length}
                </span>
              )}
            </button>
          </div>

          {/* Period Filters (Month & Year) for Financial Summary & Expenses */}
          {activeTab !== "defaulters" && (
            <div className="flex items-center gap-2 pb-3">
              <select
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(Number(event.target.value))
                }
                className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
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
                className="w-24 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* TAB 1: FINANCIAL SUMMARY */}
        {activeTab === "summary" && (
          <div className="p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Monthly Financial Statement ({selectedYear})
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated from payment records, approved expenses, and billing dues.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {summaryQuery.isLoading || monthlyQuery.isLoading ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-600">
                  Loading financial statement...
                </p>
              ) : summaryQuery.isError || monthlyQuery.isError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-center text-xs text-red-700">
                  {getSafeErrorMessage(summaryQuery.error ?? monthlyQuery.error)}
                </p>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No report data is available for {selectedYear}{selectedMonth ? ` (${monthLabels[selectedMonth - 1]})` : ""}.
                </div>
              ) : (
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="pb-3 font-semibold">Month</th>
                      <th className="pb-3 font-semibold text-emerald-800">Collection</th>
                      <th className="pb-3 font-semibold text-rose-800">Expenses</th>
                      <th className="pb-3 font-semibold text-amber-800">Outstanding</th>
                      <th className="pb-3 font-semibold text-red-800">Late Fees</th>
                      <th className="pb-3 font-semibold">Net Balance</th>
                      <th className="pb-3 text-right font-semibold">P/L Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rows.map((report) => {
                      const isSurplus = report.balance >= 0;

                      return (
                        <tr
                          key={`${report.year}-${report.month}`}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <td className="py-3.5 font-semibold text-slate-900">
                            {monthLabels[report.month - 1]} {report.year}
                          </td>
                          <td className="py-3.5 font-semibold text-emerald-700">
                            {formatCurrency(report.collection)}
                          </td>
                          <td className="py-3.5 font-medium text-slate-700">
                            {formatCurrency(report.expenses)}
                          </td>
                          <td className="py-3.5 font-medium text-amber-700">
                            {formatCurrency(report.outstanding)}
                          </td>
                          <td className="py-3.5 font-medium text-red-600">
                            {formatCurrency(report.lateFees)}
                          </td>
                          <td className="py-3.5 font-bold text-slate-900">
                            {formatCurrency(report.balance)}
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                isSurplus
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {isSurplus ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3" />
                                  Surplus
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="h-3 w-3" />
                                  Deficit
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Annual Totals Footer */}
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50/80 text-xs font-bold">
                    <tr>
                      <td className="py-3.5 text-slate-900">Annual Total</td>
                      <td className="py-3.5 text-emerald-700">{formatCurrency(annualTotals.collection)}</td>
                      <td className="py-3.5 text-slate-800">{formatCurrency(annualTotals.expenses)}</td>
                      <td className="py-3.5 text-amber-700">{formatCurrency(annualTotals.outstanding)}</td>
                      <td className="py-3.5 text-red-600">{formatCurrency(annualTotals.lateFees)}</td>
                      <td className="py-3.5 text-slate-900">{formatCurrency(annualTotals.balance)}</td>
                      <td className="py-3.5 text-right">
                        <span className="text-[11px] font-bold text-slate-600">
                          {annualTotals.balance >= 0 ? "Net Surplus" : "Net Deficit"}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEFAULTERS REPORT */}
        {activeTab === "defaulters" && (
          <div className="p-5">
            {/* Defaulters Filter & Search Bar */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={defaulterSearch}
                  onChange={(e) => {
                    setDefaulterSearch(e.target.value);
                    setDefaultersPage(1);
                  }}
                  placeholder="Search resident or flat..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
              </div>

              {/* Overdue Age Filter Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Aging:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {(["ALL", "30", "60", "90"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setOverdueFilter(filter);
                        setDefaultersPage(1);
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        overdueFilter === filter
                          ? "bg-white font-semibold text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {filter === "ALL" ? "All Defaulters" : `${filter}+ Days`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Defaulter Quick Stats */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Overdue Accounts: {totalDefaultersCount}</span>
              </div>
              <span className="text-amber-400">•</span>
              <div>
                Total Unpaid Due: <span className="font-bold text-amber-950">{formatCurrency(totalDefaultersAmount)}</span>
              </div>
            </div>

            {/* Defaulters Table */}
            <div className="overflow-x-auto">
              {defaultersQuery.isLoading ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  Scanning billing records...
                </p>
              ) : paginatedDefaulters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    No Overdue Bills Found
                  </p>
                  <p className="text-xs text-slate-500">
                    All residents are up-to-date with their payments for this criteria.
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="pb-3 font-semibold">Flat / Unit</th>
                      <th className="pb-3 font-semibold">Resident</th>
                      <th className="pb-3 font-semibold">Due Amount</th>
                      <th className="pb-3 font-semibold">Bill Due Date</th>
                      <th className="pb-3 font-semibold">Overdue Duration</th>
                      <th className="pb-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedDefaulters.map((defaulter) => (
                      <tr
                        key={defaulter.billId}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="py-3.5 font-semibold text-slate-900">
                          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            <Building className="h-3 w-3 text-slate-400" />
                            {defaulter.unitName || (defaulter.flatNumber ? `Flat ${defaulter.flatNumber}` : "Unit")}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{defaulter.residentName || "Resident"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-red-600 text-sm">
                          {formatCurrency(defaulter.balanceAmount)}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {formatDate(defaulter.dueDate)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${getOverdueBadgeClass(
                              defaulter.overdueDays
                            )}`}
                          >
                            {defaulter.overdueDays} days overdue
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 border border-red-200">
                            {defaulter.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Standard Pagination for Defaulters */}
            {totalDefaultersCount > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 print:hidden">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(defaultersPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(defaultersPage * ITEMS_PER_PAGE, totalDefaultersCount)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {totalDefaultersCount}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={defaultersPage === 1}
                    onClick={() => setDefaultersPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {defaultersPage} of {totalDefaulterPages}
                  </span>
                  <button
                    type="button"
                    disabled={defaultersPage === totalDefaulterPages}
                    onClick={() => setDefaultersPage((p) => Math.min(totalDefaulterPages, p + 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSE BREAKDOWN */}
        {activeTab === "expenses" && (
          <div className="p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Category-Wise Expense Breakdown ({selectedMonth ? `${monthLabels[selectedMonth - 1]} ` : ""}{selectedYear})
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed distribution of community operational and capital expenses.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Total Expenses: <span className="font-bold text-rose-700">{formatCurrency(totalFilteredExpenseAmount)}</span>
              </div>
            </div>

            {expenseBreakdownQuery.isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading expense breakdown...
              </div>
            ) : expenseCategoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No approved or paid expenses recorded for {selectedYear}{selectedMonth ? ` (${monthLabels[selectedMonth - 1]})` : ""}.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Progress Bar Distribution */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Category Share Distribution</p>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    {expenseCategoryBreakdown.map((cat, idx) => {
                      const colors = [
                        "bg-[#07584F]",
                        "bg-teal-600",
                        "bg-blue-600",
                        "bg-indigo-600",
                        "bg-amber-600",
                        "bg-rose-600",
                        "bg-slate-600",
                        "bg-emerald-600",
                      ];
                      const color = colors[idx % colors.length];

                      return (
                        <div
                          key={cat.category}
                          style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                          className={`${color} transition-all duration-300`}
                          title={`${categoryLabels[cat.category] || cat.category}: ${cat.percentage.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Categories Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="pb-3 font-semibold">Expense Category</th>
                        <th className="pb-3 font-semibold">Entries</th>
                        <th className="pb-3 font-semibold">Amount Spent</th>
                        <th className="pb-3 font-semibold">Share (%)</th>
                        <th className="pb-3 text-right font-semibold">Share Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {expenseCategoryBreakdown.map((item) => (
                        <tr
                          key={item.category}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <td className="py-3.5 font-semibold text-slate-900">
                            {categoryLabels[item.category] || item.category}
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {item.count} bills
                          </td>
                          <td className="py-3.5 font-bold text-rose-700 text-sm">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700">
                            {item.percentage.toFixed(1)}%
                          </td>
                          <td className="py-3.5 text-right w-36">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#07584F]"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 bg-slate-50/80 text-xs font-bold">
                      <tr>
                        <td className="py-3 text-slate-900">Total</td>
                        <td className="py-3 text-slate-600">
                          {expenseCategoryBreakdown.reduce((s, i) => s + i.count, 0)} bills
                        </td>
                        <td className="py-3 text-rose-700">
                          {formatCurrency(totalFilteredExpenseAmount)}
                        </td>
                        <td className="py-3 text-slate-900">100.0%</td>
                        <td className="py-3 text-right">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
