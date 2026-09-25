"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Info,
  Search,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createExpense,
  getExpenseSummary,
  getExpenses,
  getMaintenancePayouts,
  processMaintenancePayout,
  updateExpense,
  type Expense,
  type ExpenseCategory,
  type ExpenseStatus,
  type MaintenancePayout,
  type UpdateExpensePayload,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import AddExpenseModal, {
  NewExpenseData,
} from "./AddExpenseModal";

const statusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
};

const statusClassNames: Record<ExpenseStatus, string> = {
  PENDING:
    "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200",
  APPROVED:
    "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200",
  REJECTED:
    "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200",
  PAID:
    "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200",
};

const CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "WATER", label: "Water" },
  { value: "SECURITY", label: "Security" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "REPAIR", label: "Repair" },
  { value: "SALARY", label: "Salary" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_METHODS = [
  "Bank Transfer",
  "UPI",
  "Cash",
  "Cheque",
  "Card",
  "Other",
];

const ITEMS_PER_PAGE = 8;

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the expense request.";

export default function TreasurerExpenses() {
  const queryClient = useQueryClient();

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [approveExpense, setApproveExpense] = useState<Expense | null>(null);
  const [rejectExpense, setRejectExpense] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [payExpense, setPayExpense] = useState<Expense | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Maintenance Payouts state
  const [activeTab, setActiveTab] = useState<"society_expenses" | "maintenance_payouts">("society_expenses");
  const [selectedPayout, setSelectedPayout] = useState<MaintenancePayout | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [maintenancePage, setMaintenancePage] = useState(1);

  // Search, Filter & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const expensesQuery = useQuery({
    queryKey: ["treasurer", "expenses", search, statusFilter, categoryFilter],
    queryFn: () =>
      getExpenses({
        search: search.trim() || undefined,
        status:
          statusFilter === "ALL"
            ? undefined
            : (statusFilter as ExpenseStatus),
        category:
          categoryFilter === "ALL"
            ? undefined
            : (categoryFilter as ExpenseCategory),
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["treasurer", "expenses-summary"],
    queryFn: () => getExpenseSummary(),
  });

  const maintenancePayoutsQuery = useQuery({
    queryKey: ["treasurer", "maintenance-payouts"],
    queryFn: () => getMaintenancePayouts(),
  });

  const maintenancePayouts = maintenancePayoutsQuery.data ?? [];

  const invalidateExpenseData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "expenses"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "expenses-summary"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "maintenance-payouts"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "finance-summary"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "monthly-finance"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "audit"],
      }),
    ]);
  };

  const processPayoutMutation = useMutation({
    mutationFn: ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: { paymentMethod?: string; notes?: string };
    }) => processMaintenancePayout(jobId, payload),
    onSuccess: async () => {
      toast.success("Maintenance payout recorded and added to Expenses!");
      setSelectedPayout(null);
      setPayoutNotes("");
      await invalidateExpenseData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      toast.success("Expense created successfully.");
      setIsAddExpenseOpen(false);
      await invalidateExpenseData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: UpdateExpensePayload;
    }) => updateExpense(expenseId, payload),
    onSuccess: async (_, variables) => {
      if (variables.payload.status === "APPROVED") {
        toast.success("Expense approved.");
        setApproveExpense(null);
      } else if (variables.payload.status === "REJECTED") {
        toast.success("Expense rejected.");
        setRejectExpense(null);
        setRejectReason("");
      } else if (variables.payload.status === "PAID") {
        toast.success("Expense marked as Paid.");
        setPayExpense(null);
        setPaymentRefNo("");
      }
      await invalidateExpenseData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const handleAddExpense = async (newExpense: NewExpenseData) => {
    await createMutation.mutateAsync(newExpense);
  };

  const expenses = expensesQuery.data ?? [];
  const summary = summaryQuery.data ?? {
    totalExpenses: 0,
    approvedExpenses: 0,
    pendingExpenses: 0,
    pendingCount: 0,
  };

  const expenseSummary = [
    {
      title: "Total Expenses",
      value: formatCurrency(summary.totalExpenses),
      icon: WalletCards,
      accent: "from-[#07584F] to-emerald-600",
    },
    {
      title: "Approved Expenses",
      value: formatCurrency(summary.approvedExpenses),
      icon: CircleDollarSign,
      accent: "from-blue-500 to-blue-600",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pendingExpenses),
      icon: Clock3,
      accent: "from-amber-500 to-amber-600",
    },
    {
      title: "Pending Requests",
      value: summary.pendingCount.toString(),
      icon: FileText,
      accent: "from-rose-500 to-rose-600",
    },
  ];

  // Paginated Expenses
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return expenses.slice(start, start + ITEMS_PER_PAGE);
  }, [expenses, currentPage]);

  // Filtered & Paginated Maintenance Payouts
  const filteredMaintenancePayouts = useMemo(() => {
    return maintenancePayouts.filter((item) => {
      if (!maintenanceSearch.trim()) return true;
      const q = maintenanceSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.technicianName && item.technicianName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.flatNumber && item.flatNumber.toLowerCase().includes(q)) ||
        (item.reviewedByName && item.reviewedByName.toLowerCase().includes(q))
      );
    });
  }, [maintenancePayouts, maintenanceSearch]);

  const totalMaintenancePages =
    Math.ceil(filteredMaintenancePayouts.length / ITEMS_PER_PAGE) || 1;
  const paginatedMaintenancePayouts = useMemo(() => {
    const start = (maintenancePage - 1) * ITEMS_PER_PAGE;
    return filteredMaintenancePayouts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMaintenancePayouts, maintenancePage]);

  // CSV Export
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export.");
      return;
    }
    const headers = [
      "Title",
      "Invoice / Ref",
      "Category",
      "Vendor",
      "Amount",
      "Expense Date",
      "Status",
      "Payment Method",
      "Payment Ref",
      "Paid Date",
      "Rejection Reason",
      "Description",
    ];
    const rows = expenses.map((e) => [
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${(e.invoiceRef || "").replace(/"/g, '""')}"`,
      `"${(e.category || "").replace(/"/g, '""')}"`,
      `"${(e.vendorName || "Not recorded").replace(/"/g, '""')}"`,
      e.amount,
      e.expenseDate ? new Date(e.expenseDate).toISOString().split("T")[0] : "",
      e.status,
      `"${(e.paymentMethod || "").replace(/"/g, '""')}"`,
      `"${(e.paymentReference || "").replace(/"/g, '""')}"`,
      e.paidAt ? new Date(e.paidAt).toISOString().split("T")[0] : "",
      `"${(e.rejectionReason || "").replace(/"/g, '""')}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `nesteeq-expenses-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported to CSV.");
  };

  // Confirm Actions
  const handleConfirmApprove = () => {
    if (!approveExpense) return;
    updateMutation.mutate({
      expenseId: approveExpense._id,
      payload: { status: "APPROVED" },
    });
  };

  const handleConfirmReject = () => {
    if (!rejectExpense) return;
    const reasonText = rejectReason.trim() || undefined;
    updateMutation.mutate({
      expenseId: rejectExpense._id,
      payload: {
        status: "REJECTED",
        rejectionReason: reasonText,
      },
    });
  };

  const handleConfirmMarkPaid = () => {
    if (!payExpense) return;
    updateMutation.mutate({
      expenseId: payExpense._id,
      payload: {
        status: "PAID",
        paymentMethod,
        paymentReference: paymentRefNo.trim() || undefined,
        paidAt: paymentDate ? new Date(paymentDate).toISOString() : undefined,
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expenses
            </h1>
            <p className="text-sm text-slate-500">
              Manage apartment operational expenses, approvals, and disbursement records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="self-start rounded-lg bg-[#07584F] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
          >
            Add Expense
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expenseSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accent}`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expenses List Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-5 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("society_expenses")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-semibold transition ${
                activeTab === "society_expenses"
                  ? "border-[#07584F] text-[#07584F]"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <WalletCards className="h-4 w-4" />
              Society Expenses
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {expenses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("maintenance_payouts")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-semibold transition ${
                activeTab === "maintenance_payouts"
                  ? "border-[#07584F] text-[#07584F]"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Wrench className="h-4 w-4" />
              Approved Maintenance Invoices
              {maintenancePayouts.length > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {maintenancePayouts.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* Pending Maintenance Invoices Announcement Banner when on society_expenses */}
          {maintenancePayouts.length > 0 && activeTab === "society_expenses" && (
            <div className="mx-5 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  <strong>{maintenancePayouts.length} maintenance invoice{maintenancePayouts.length > 1 ? "s" : ""}</strong> approved by Facility Managers awaiting treasurer payout disbursement.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("maintenance_payouts")}
                className="rounded-md bg-amber-700 px-3 py-1 font-semibold text-white hover:bg-amber-800 transition whitespace-nowrap"
              >
                Review & Disburse &rarr;
              </button>
            </div>
          )}

          {activeTab === "maintenance_payouts" ? (
            <div>
              {/* Header & Search */}
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Approved Maintenance Invoices
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Invoices verified and forwarded by the Facility Manager for contractor & technician payout.
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={maintenanceSearch}
                      onChange={(e) => {
                        setMaintenanceSearch(e.target.value);
                        setMaintenancePage(1);
                      }}
                      placeholder="Search job, technician, flat..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F] focus:bg-white"
                    />
                    {maintenanceSearch ? (
                      <button
                        type="button"
                        onClick={() => setMaintenanceSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Maintenance Table */}
              <div className="overflow-x-auto p-5 sm:p-6">
                {maintenancePayoutsQuery.isLoading ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Loading maintenance invoices...
                  </p>
                ) : maintenancePayoutsQuery.isError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {getSafeErrorMessage(maintenancePayoutsQuery.error)}
                  </p>
                ) : filteredMaintenancePayouts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {maintenanceSearch
                        ? "No matching maintenance invoices found"
                        : "No pending maintenance invoices"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {maintenanceSearch
                        ? "Try adjusting your search keyword."
                        : "All invoices approved by the Facility Manager have been settled."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="pb-3">Maintenance Job</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Technician / Vendor</th>
                        <th className="pb-3">Facility Approval</th>
                        <th className="pb-3">Approved Amount</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedMaintenancePayouts.map((item) => (
                        <tr
                          key={item._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="py-3.5 font-medium text-slate-900">
                            <span className="block font-semibold text-slate-900">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                                {item.category}
                              </span>
                              {item.priority ? (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                    item.priority === "URGENT" || item.priority === "HIGH"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : "bg-slate-50 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600">
                            <span className="font-medium text-slate-800">
                              {item.flatNumber}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700">
                            <span className="font-semibold text-slate-800 block">
                              {item.technicianName}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs text-slate-500">
                            <span className="font-medium text-slate-800 block">
                              {item.reviewedByName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatDate(item.forwardedAt)}
                            </span>
                            {item.remarks ? (
                              <span
                                className="text-[11px] text-slate-600 italic block line-clamp-1 max-w-xs"
                                title={item.remarks}
                              >
                                &ldquo;{item.remarks}&rdquo;
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-[#07584F]">
                              {formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayout(item);
                                setPayoutMethod("UPI");
                                setPayoutNotes("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Disburse Payout
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Maintenance Pagination */}
                {filteredMaintenancePayouts.length > ITEMS_PER_PAGE ? (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <p>
                      Showing{" "}
                      <span className="font-semibold text-slate-800">
                        {(maintenancePage - 1) * ITEMS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-800">
                        {Math.min(
                          maintenancePage * ITEMS_PER_PAGE,
                          filteredMaintenancePayouts.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-800">
                        {filteredMaintenancePayouts.length}
                      </span>{" "}
                      invoices
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={maintenancePage === 1}
                        onClick={() =>
                          setMaintenancePage((p) => Math.max(1, p - 1))
                        }
                        className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-slate-700">
                        Page {maintenancePage} of {totalMaintenancePages}
                      </span>
                      <button
                        type="button"
                        disabled={maintenancePage === totalMaintenancePages}
                        onClick={() =>
                          setMaintenancePage((p) =>
                            Math.min(totalMaintenancePages, p + 1)
                          )
                        }
                        className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Expense Records
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Detailed ledger of all society maintenance and utility bills.
                    </p>
                  </div>

                  {/* Filters & Export */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search title, vendor..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F] focus:bg-white"
                      />
                      {search ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {/* Category Dropdown */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#07584F]"
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    {/* Status Dropdown */}
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#07584F]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PAID">Paid</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Export CSV Button */}
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      title="Export filtered records to CSV"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-5 sm:p-6">
                {expensesQuery.isLoading ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Loading expenses...
                  </p>
                ) : expensesQuery.isError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {getSafeErrorMessage(expensesQuery.error)}
                  </p>
                ) : expenses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                    <Search className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      No matching expense records found
                    </p>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search keyword or filters.
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="pb-3">Expense</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Vendor / Payee</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedExpenses.map((expense: Expense) => (
                        <tr
                          key={expense._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="py-3.5 font-medium text-slate-900">
                            <span className="block font-semibold text-slate-900">
                              {expense.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {expense.invoiceRef ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                                  Ref: {expense.invoiceRef}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {expense.category}
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {expense.vendorName || "Not recorded"}
                          </td>
                          <td className="py-3.5 font-bold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {formatDate(expense.expenseDate)}
                          </td>
                          <td className="py-3.5">
                            <span className={statusClassNames[expense.status]}>
                              {statusLabels[expense.status]}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailExpense(expense)}
                                title="View Details"
                                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {expense.status === "PENDING" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setApproveExpense(expense)}
                                    className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectExpense(expense)}
                                    className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : null}

                              {expense.status === "APPROVED" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayExpense(expense);
                                    setPaymentMethod("Bank Transfer");
                                    setPaymentRefNo("");
                                    setPaymentDate(
                                      new Date().toISOString().split("T")[0]
                                    );
                                  }}
                                  className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                  Mark Paid
                                </button>
                              ) : null}

                              {expense.status === "PAID" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Settled
                                </span>
                              ) : null}

                              {expense.status === "REJECTED" ? (
                                <span className="text-xs font-medium text-slate-400">
                                  Declined
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Pagination */}
                {expenses.length > ITEMS_PER_PAGE ? (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <p>
                      Showing{" "}
                      <span className="font-semibold text-slate-800">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-800">
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          expenses.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-800">
                        {expenses.length}
                      </span>{" "}
                      expenses
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {approveExpense ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Approve Expense?
              </h3>
              <button
                type="button"
                onClick={() => setApproveExpense(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs text-slate-600">
              <p>
                Are you sure you want to approve this expenditure request for payment?
              </p>
              <div className="rounded-lg bg-slate-50 p-3 text-slate-800 space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense:</span>
                  <span className="font-semibold">{approveExpense.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor:</span>
                  <span>{approveExpense.vendorName || "Not recorded"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1">
                  <span className="text-slate-500 font-medium">Amount:</span>
                  <span className="font-bold text-[#07584F] text-sm">
                    {formatCurrency(approveExpense.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setApproveExpense(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={handleConfirmApprove}
                className="rounded-lg bg-[#07584F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#064e46]"
              >
                {updateMutation.isPending ? "Approving..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Confirmation Modal with Reason */}
      {rejectExpense ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Reject Expense
              </h3>
              <button
                type="button"
                onClick={() => setRejectExpense(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Rejecting this expense of{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(rejectExpense.amount)}
                </span>{" "}
                for <strong>{rejectExpense.title}</strong>. Please provide a reason for the audit record.
              </p>

              <div>
                <label
                  htmlFor="rejectReason"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Rejection Reason
                </label>
                <textarea
                  id="rejectReason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invoice amount exceeds approved budget or duplicate claim."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 outline-none transition focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRejectExpense(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={handleConfirmReject}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                {updateMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mark Paid Modal */}
      {payExpense ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Record Payment / Disbursed
              </h3>
              <button
                type="button"
                onClick={() => setPayExpense(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 text-slate-800 space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payee:</span>
                  <span className="font-semibold">{payExpense.vendorName || payExpense.title}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1">
                  <span className="text-slate-500 font-medium">Disbursement Amount:</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {formatCurrency(payExpense.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="paymentMethod"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="paymentRefNo"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Reference / UTR / Cheque No. (Optional)
                </label>
                <input
                  id="paymentRefNo"
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="e.g. UTR-982187319"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="paymentDate"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Payment Date
                </label>
                <input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPayExpense(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={handleConfirmMarkPaid}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {updateMutation.isPending ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Expense Details Modal */}
      {detailExpense ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900">Expense Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailExpense(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expense Name:</span>
                <span className="font-semibold text-slate-900">
                  {detailExpense.title}
                </span>
              </div>
              {detailExpense.invoiceRef ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Invoice / Ref No.:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {detailExpense.invoiceRef}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">
                  {detailExpense.category}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vendor / Payee:</span>
                <span className="font-medium text-slate-800">
                  {detailExpense.vendorName || "Not recorded"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-[#07584F] text-sm">
                  {formatCurrency(detailExpense.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expense Date:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(detailExpense.expenseDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className={statusClassNames[detailExpense.status]}>
                  {statusLabels[detailExpense.status]}
                </span>
              </div>
              {detailExpense.status === "PAID" && (detailExpense.paymentMethod || detailExpense.paymentReference || detailExpense.paidAt) ? (
                <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-100 space-y-1">
                  <span className="text-[11px] font-semibold text-blue-900 block">Payment Details</span>
                  {detailExpense.paymentMethod ? (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Method:</span>
                      <span className="font-medium text-slate-800">{detailExpense.paymentMethod}</span>
                    </div>
                  ) : null}
                  {detailExpense.paymentReference ? (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Reference:</span>
                      <span className="font-mono text-slate-800">{detailExpense.paymentReference}</span>
                    </div>
                  ) : null}
                  {detailExpense.paidAt ? (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Settled On:</span>
                      <span className="font-medium text-slate-800">{formatDate(detailExpense.paidAt)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {detailExpense.status === "REJECTED" && detailExpense.rejectionReason ? (
                <div className="rounded-lg bg-red-50/50 p-2.5 border border-red-100 space-y-1">
                  <span className="text-[11px] font-semibold text-red-900 block">Rejection Reason</span>
                  <p className="text-slate-700 text-[11px]">{detailExpense.rejectionReason}</p>
                </div>
              ) : null}
              {detailExpense.description ? (
                <div className="py-2">
                  <span className="text-slate-500 block mb-1">Notes / Description:</span>
                  <div className="rounded-lg bg-slate-50 p-2.5 text-slate-700 whitespace-pre-wrap font-mono text-[11px] border border-slate-100">
                    {detailExpense.description}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailExpense(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Process Maintenance Payout Modal */}
      {selectedPayout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#07584F] border border-emerald-200">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Disburse Maintenance Payout
                  </h3>
                  <p className="text-xs text-slate-500">
                    Settle invoice and record as an official Society Expense
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 text-slate-800 space-y-2 border border-slate-200/80">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Service / Job:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {selectedPayout.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-medium text-slate-700">
                    {selectedPayout.flatNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Technician / Payee:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPayout.technicianName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved by Facility:</span>
                  <span className="text-slate-700">
                    {selectedPayout.reviewedByName}
                  </span>
                </div>
                {selectedPayout.remarks ? (
                  <div className="rounded bg-white p-2 text-slate-600 border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Facility Manager Note:
                    </span>
                    {selectedPayout.remarks}
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-2 items-baseline">
                  <span className="text-slate-700 font-semibold text-sm">
                    Disbursement Amount:
                  </span>
                  <span className="font-bold text-xl text-[#07584F]">
                    {formatCurrency(selectedPayout.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="payoutMethod"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Payment Mode
                </label>
                <select
                  id="payoutMethod"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#07584F]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payoutNotes"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Transaction / Cheque / UTR Ref & Notes (Optional)
                </label>
                <input
                  id="payoutNotes"
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI Ref 4029188219"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processPayoutMutation.isPending}
                onClick={() => {
                  processPayoutMutation.mutate({
                    jobId: selectedPayout._id,
                    payload: {
                      paymentMethod: payoutMethod,
                      notes: payoutNotes.trim() || undefined,
                    },
                  });
                }}
                className="rounded-lg bg-[#07584F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#064e46]"
              >
                {processPayoutMutation.isPending
                  ? "Processing..."
                  : "Confirm & Disburse Payout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={handleAddExpense}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
