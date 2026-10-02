"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Filter,
  Info,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShieldAlert,
  Smartphone,
  Wallet,
  X,
  Banknote,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import {
  getBills,
  getPayments,
  recordBillPayment,
  reversePayment,
  type Bill,
  type Payment,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import TransactionReceiptModal from "./TransactionReceiptModal";

const ITEMS_PER_PAGE = 10;

const PAYMENT_METHODS = [
  "ALL",
  "UPI",
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Wallet",
  "Card",
  "Other",
];

const DATE_PRESETS = [
  { id: "ALL", label: "All Time" },
  { id: "TODAY", label: "Today" },
  { id: "THIS_WEEK", label: "This Week" },
  { id: "THIS_MONTH", label: "This Month" },
  { id: "LAST_MONTH", label: "Last Month" },
];

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to process the request.";

export default function TreasurerPayments() {
  const queryClient = useQueryClient();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALID" | "REVERSED">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<Payment | null>(null);
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Record Payment Form State
  const [recordBillId, setRecordBillId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState("UPI");
  const [recordRefNo, setRecordRefNo] = useState("");
  const [recordDescription, setRecordDescription] = useState("");

  // Data Queries
  const paymentsQuery = useQuery({
    queryKey: ["treasurer", "payments-ledger"],
    queryFn: () => getPayments({ limit: 500, includeReversed: true }),
  });

  const billsQuery = useQuery({
    queryKey: ["treasurer", "outstanding-bills"],
    queryFn: () => getBills(),
  });

  const allPayments = paymentsQuery.data ?? [];
  const allBills = billsQuery.data ?? [];

  // Filter bills that have unpaid balances for the quick record modal
  const unpaidBills = useMemo(() => {
    return allBills.filter((b) => b.balanceAmount > 0 && b.status !== "PAID");
  }, [allBills]);

  // Selected bill in the record payment modal
  const selectedRecordBill = useMemo(() => {
    return unpaidBills.find((b) => b._id === recordBillId) || null;
  }, [unpaidBills, recordBillId]);

  // Handle bill selection in record modal
  const handleSelectRecordBill = (billId: string) => {
    setRecordBillId(billId);
    const b = unpaidBills.find((x) => x._id === billId);
    if (b) {
      setRecordAmount(String(b.balanceAmount));
    }
  };

  // Reversal Mutation
  const reverseMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      reversePayment(paymentId, reason),
    onSuccess: async () => {
      toast.success("Payment successfully reversed & bill balance restored.");
      setReversingPayment(null);
      setReversalReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["treasurer", "payments-ledger"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "bills"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "outstanding-bills"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "finance-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "monthly-finance"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "audit"] }),
      ]);
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  // Record Payment Mutation
  const recordMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
      method,
      refNo,
      desc,
    }: {
      billId: string;
      amount: number;
      method: string;
      refNo?: string;
      desc?: string;
    }) =>
      recordBillPayment(billId, amount, {
        paymentMethod: method,
        referenceNo: refNo,
        description: desc,
      }),
    onSuccess: async (updatedBill) => {
      toast.success("Payment recorded successfully.");
      setIsRecordModalOpen(false);
      setRecordBillId("");
      setRecordAmount("");
      setRecordRefNo("");
      setRecordDescription("");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["treasurer", "payments-ledger"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "bills"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "outstanding-bills"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "finance-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "monthly-finance"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "audit"] }),
      ]);
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const handleRecordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!recordBillId) {
      toast.error("Please select a bill to record payment against.");
      return;
    }
    const amt = Number(recordAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    if (selectedRecordBill && amt > selectedRecordBill.balanceAmount) {
      toast.error(
        `Payment amount cannot exceed remaining balance (₹${selectedRecordBill.balanceAmount}).`
      );
      return;
    }

    recordMutation.mutate({
      billId: recordBillId,
      amount: amt,
      method: recordMethod,
      refNo: recordRefNo.trim() || undefined,
      desc: recordDescription.trim() || undefined,
    });
  };

  const handleConfirmReversal = (e: FormEvent) => {
    e.preventDefault();
    if (!reversingPayment) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 3) {
      toast.error("Please provide a valid reason (at least 3 characters) for the reversal.");
      return;
    }
    reverseMutation.mutate({
      paymentId: reversingPayment._id,
      reason: reversalReason.trim(),
    });
  };

  // Date Filter Range Computation
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    if (datePreset === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) };
    }
    if (datePreset === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(now.getFullYear(), now.getMonth(), diff);
      start.setHours(0, 0, 0, 0);
      return { start, end: new Date() };
    }
    if (datePreset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: new Date() };
    }
    if (datePreset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    return null;
  }, [datePreset]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      // Status Filter
      if (statusFilter === "VALID" && p.reversed) return false;
      if (statusFilter === "REVERSED" && !p.reversed) return false;

      // Method Filter
      if (selectedMethod !== "ALL") {
        const methodUpper = (p.paymentMethod || p.source || "").toUpperCase();
        const targetUpper = selectedMethod.toUpperCase();
        if (!methodUpper.includes(targetUpper)) return false;
      }

      // Date Range Filter
      if (dateRangeBounds) {
        const pDate = new Date(p.paidAt);
        if (pDate < dateRangeBounds.start || pDate > dateRangeBounds.end) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const receiptNo = (p.receiptNumber || "").toLowerCase();
        const resident = (p.residentName || "").toLowerCase();
        const flat = (p.flatNumber || p.unitName || "").toLowerCase();
        const refNo = (p.referenceNo || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const bill = (p.billTitle || "").toLowerCase();

        const matches =
          receiptNo.includes(q) ||
          resident.includes(q) ||
          flat.includes(q) ||
          refNo.includes(q) ||
          desc.includes(q) ||
          bill.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [allPayments, statusFilter, selectedMethod, dateRangeBounds, searchQuery]);

  // Metrics (calculated from filtered valid payments)
  const metrics = useMemo(() => {
    let totalCollected = 0;
    let digitalCollected = 0;
    let cashCollected = 0;
    let reversedCount = 0;
    let validCount = 0;

    for (const p of filteredPayments) {
      if (p.reversed) {
        reversedCount++;
        continue;
      }
      validCount++;
      totalCollected += p.amount;
      const m = (p.paymentMethod || p.source || "").toUpperCase();
      if (m.includes("CASH")) {
        cashCollected += p.amount;
      } else {
        digitalCollected += p.amount;
      }
    }

    return {
      totalCollected,
      digitalCollected,
      cashCollected,
      totalCount: filteredPayments.length,
      validCount,
      reversedCount,
    };
  }, [filteredPayments]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPayments = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, validCurrentPage]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = [
      "Receipt Number",
      "Date",
      "Flat",
      "Resident Name",
      "Payment Purpose / Bill",
      "Payment Mode",
      "Reference / UTR",
      "Amount (INR)",
      "Status",
      "Reversal Reason",
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber || `REC-${p._id.slice(-6).toUpperCase()}`,
      new Date(p.paidAt).toLocaleString("en-IN"),
      p.unitName || (p.flatNumber ? `Flat ${p.flatNumber}` : "Unit"),
      `"${(p.residentName || "").replace(/"/g, '""')}"`,
      `"${(p.billTitle || "Maintenance").replace(/"/g, '""')}"`,
      p.paymentMethod || p.source,
      `"${(p.referenceNo || "").replace(/"/g, '""')}"`,
      p.amount,
      p.reversed ? "REVERSED" : "COMPLETED",
      `"${(p.reversalReason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Nesteeq_Collection_Register_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Collection register successfully exported to CSV.");
  };

  // Helper badge for payment method
  const renderMethodBadge = (method?: string, source?: string) => {
    const m = (method || source || "OTHER").toUpperCase();
    if (m.includes("UPI")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
          <Smartphone className="h-3 w-3" />
          UPI
        </span>
      );
    }
    if (m.includes("CASH")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <Banknote className="h-3 w-3" />
          Cash
        </span>
      );
    }
    if (m.includes("BANK") || m.includes("NEFT") || m.includes("RTGS") || m.includes("IMPS")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          <Building className="h-3 w-3" />
          Bank Transfer
        </span>
      );
    }
    if (m.includes("WALLET")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <Wallet className="h-3 w-3" />
          Wallet
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
        <CreditCard className="h-3 w-3" />
        {method || "Manual"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Official Collection Register
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Transaction Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Society maintenance collection register, bank reconciliation, payment receipts & transaction reversals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#07584F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#064e46] transition"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Collections */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Collections
            </p>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(metrics.totalCollected)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.validCount} successful transaction{metrics.validCount === 1 ? "" : "s"}
          </p>
        </div>

        {/* Card 2: Digital / UPI / Bank */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              UPI & Bank Inflows
            </p>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(metrics.digitalCollected)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Direct online credits & bank transfers
          </p>
        </div>

        {/* Card 3: Cash In Hand */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cash In Hand
            </p>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(metrics.cashCollected)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Physical currency received by treasurer
          </p>
        </div>

        {/* Card 4: Ledger Entries */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ledger Volume
            </p>
            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.totalCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.reversedCount > 0 ? (
              <span className="text-rose-600 font-medium">
                {metrics.reversedCount} reversed entry{metrics.reversedCount === 1 ? "" : "s"}
              </span>
            ) : (
              "All entries in good standing"
            )}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search receipt, resident, flat, UTR..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
            />
          </div>

          {/* Date Range Preset */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m === "ALL" ? "All Payment Methods" : m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
            >
              <option value="ALL">All Entries (Valid & Reversed)</option>
              <option value="VALID">Valid Collections Only</option>
              <option value="REVERSED">Reversals Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collection Register Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt & Date</th>
                <th className="py-3 px-4">Flat & Resident</th>
                <th className="py-3 px-4">Purpose / Bill</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentsQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading collection register...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No collection records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  const isReversed = p.reversed;
                  const receiptNo =
                    p.receiptNumber ||
                    `REC-${p._id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/75 transition ${
                        isReversed ? "bg-rose-50/30 text-slate-400" : ""
                      }`}
                    >
                      {/* Receipt & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {receiptNo}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(p.paidAt)}
                        </div>
                      </td>

                      {/* Flat & Resident */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.unitName || (p.flatNumber ? `Flat ${p.flatNumber}` : "Unit")}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.residentName || "Resident"}
                        </div>
                      </td>

                      {/* Purpose / Bill */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {p.billTitle || "Maintenance Fee"}
                        </div>
                        {p.billingPeriod && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.billingPeriod}
                          </div>
                        )}
                      </td>

                      {/* Method & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {renderMethodBadge(p.paymentMethod, p.source)}
                        </div>
                        {p.referenceNo ? (
                          <div className="mt-1 text-[11px] font-mono text-slate-500 truncate max-w-[140px]" title={p.referenceNo}>
                            Ref: {p.referenceNo}
                          </div>
                        ) : p.description ? (
                          <div className="mt-0.5 text-[10px] text-slate-400 truncate max-w-[140px]" title={p.description}>
                            {p.description}
                          </div>
                        ) : null}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-mono font-bold text-sm ${
                            isReversed
                              ? "line-through text-slate-400"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(p.amount)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isReversed ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200"
                            title={p.reversalReason || "Payment was reversed"}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Reversed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Settled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingReceiptPayment(p)}
                            title="View / Print Official Receipt"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {!isReversed && (
                            <button
                              onClick={() => {
                                setReversingPayment(p);
                                setReversalReason("");
                              }}
                              title="Reverse Payment"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of{" "}
              {filteredPayments.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Record Offline / Direct Payment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Log cash, cheque, or bank transfer collection against an invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs">
              {/* Bill Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Pending Bill / Invoice *
                </label>
                <select
                  value={recordBillId}
                  onChange={(e) => handleSelectRecordBill(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
                  required
                >
                  <option value="">-- Choose a pending bill --</option>
                  {unpaidBills.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.unitName || `Flat ${b.flatNumber}`} ({b.residentName}) —{" "}
                      {b.title || b.billType?.replace(/_/g, " ")} (Due: ₹{b.balanceAmount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
                  required
                />
                {selectedRecordBill && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Outstanding balance:{" "}
                    <span className="font-semibold text-rose-600">
                      ₹{selectedRecordBill.balanceAmount}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={recordMethod}
                  onChange={(e) => setRecordMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
                >
                  <option value="UPI">UPI (GooglePay, PhonePe, Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  value={recordRefNo}
                  onChange={(e) => setRecordRefNo(e.target.value)}
                  placeholder="e.g. UPI Ref / Bank UTR / Cheque #123456"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={recordDescription}
                  onChange={(e) => setRecordDescription(e.target.value)}
                  placeholder="Optional collection note"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMutation.isPending}
                  className="rounded-xl bg-[#07584F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#064e46] transition disabled:opacity-50"
                >
                  {recordMutation.isPending ? "Recording..." : "Record & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-rose-50 px-6 py-4 text-rose-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold">Reverse Payment Confirmation</h3>
              </div>
              <button
                onClick={() => setReversingPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReversal} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-amber-600" />
                  Important Accounting Notice
                </p>
                <p className="text-[11px] text-amber-800">
                  Reversing will void receipt{" "}
                  <span className="font-mono font-bold">
                    {reversingPayment.receiptNumber || reversingPayment._id.slice(-6).toUpperCase()}
                  </span>
                  , reduce society total collections by{" "}
                  <span className="font-bold text-rose-700">
                    {formatCurrency(reversingPayment.amount)}
                  </span>
                  , and restore the outstanding balance on the resident&apos;s invoice.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Reversal *
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Wrong flat selected / Bounced cheque / Duplicate entry..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reverseMutation.isPending}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {reverseMutation.isPending ? "Reversing..." : "Confirm Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={Boolean(viewingReceiptPayment)}
        onClose={() => setViewingReceiptPayment(null)}
        payment={viewingReceiptPayment}
      />
    </div>
  );
}
