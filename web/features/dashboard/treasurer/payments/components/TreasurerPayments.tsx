"use client";

import { FormEvent, useMemo, useState } from "react";
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
  Clock3,
  CreditCard,
  Download,
  Eye,
  Info,
  Printer,
  Receipt,
  Search,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getBills,
  getPayments,
  recordBillPayment,
  type Bill,
  type Payment,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the payment request.";

const statusLabels: Record<Bill["status"], string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

const statusClassNames: Record<Bill["status"], string> = {
  PENDING:
    "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200",
  PARTIALLY_PAID:
    "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200",
  PAID:
    "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200",
  OVERDUE:
    "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200",
};

const PAYMENT_METHODS = [
  "UPI",
  "Bank Transfer",
  "Cash",
  "Card",
  "Cheque",
  "Other",
];

const ITEMS_PER_PAGE = 8;

interface ReceiptData {
  receiptId: string;
  billId: string;
  residentName: string;
  unitName: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  paidAt: string;
  balanceRemaining: number;
  totalBillAmount: number;
}

export default function TreasurerPayments() {
  const queryClient = useQueryClient();

  // Modal States
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Receipt & Details Modals
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);

  // Search & Filter States
  const [recordsSearch, setRecordsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  // Pagination States
  const [recordsPage, setRecordsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Data Queries
  const billsQuery = useQuery({
    queryKey: ["treasurer", "bills"],
    queryFn: () => getBills(),
  });

  const paymentsQuery = useQuery({
    queryKey: ["treasurer", "payments"],
    queryFn: () => getPayments({ limit: 100 }),
  });

  // Record Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
      method,
      refNo,
      desc,
    }: {
      billId: string;
      amount: number;
      method?: string;
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

      // Open Receipt for immediate confirmation
      if (selectedBill) {
        const remaining = Math.max(0, selectedBill.balanceAmount - Number(paymentAmount));
        setReceiptModalData({
          receiptId: `REC-${Date.now().toString().slice(-6)}`,
          billId: selectedBill._id,
          residentName: selectedBill.residentName || "Resident",
          unitName: selectedBill.unitName || (selectedBill.flatNumber ? `Flat ${selectedBill.flatNumber}` : "Unit"),
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNo: referenceNo.trim() || undefined,
          paidAt: new Date().toISOString(),
          balanceRemaining: remaining,
          totalBillAmount: selectedBill.totalAmount,
        });
      }

      closeRecordPaymentModal();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["treasurer", "bills"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "payments"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "finance-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "monthly-finance"] }),
        queryClient.invalidateQueries({ queryKey: ["treasurer", "audit"] }),
      ]);
    },
    onError: (error) => {
      const message = getSafeErrorMessage(error);
      setPaymentError(message);
      toast.error(message);
    },
  });

  const bills = billsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  // Summary Metrics
  const totalCollected = bills.reduce((total, bill) => total + bill.paidAmount, 0);
  const pendingAmount = bills
    .filter((bill) => bill.status !== "PAID")
    .reduce((total, bill) => total + bill.balanceAmount, 0);
  const completedPayments = bills.filter((bill) => bill.status === "PAID").length;
  const pendingBillCount = bills.filter((bill) => bill.balanceAmount > 0).length;

  const paymentSummary = [
    {
      title: "Total Collected",
      value: formatCurrency(totalCollected, 2),
      icon: CircleDollarSign,
      accent: "from-[#07584F] to-emerald-600",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(pendingAmount, 2),
      icon: Clock3,
      accent: "from-amber-500 to-amber-600",
    },
    {
      title: "Completed Bills",
      value: completedPayments.toString(),
      icon: CheckCircle2,
      accent: "from-blue-500 to-blue-600",
    },
    {
      title: "Pending Bills",
      value: pendingBillCount.toString(),
      icon: CreditCard,
      accent: "from-rose-500 to-rose-600",
    },
  ];

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const resident = (bill.residentName || "").toLowerCase();
      const unit = (bill.unitName || bill.flatNumber || "").toLowerCase();
      const term = recordsSearch.toLowerCase().trim();
      const matchesSearch = !term || resident.includes(term) || unit.includes(term);
      const matchesStatus = statusFilter === "ALL" || bill.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, recordsSearch, statusFilter]);

  // Paginated Bills
  const totalBillPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE) || 1;
  const paginatedBills = useMemo(() => {
    const start = (recordsPage - 1) * ITEMS_PER_PAGE;
    return filteredBills.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBills, recordsPage]);

  // Filtered History
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const resident = (payment.residentName || "").toLowerCase();
      const unit = (payment.unitName || payment.flatNumber || "").toLowerCase();
      const term = historySearch.toLowerCase().trim();
      const matchesSearch = !term || resident.includes(term) || unit.includes(term);
      const matchesSource = sourceFilter === "ALL" || payment.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [payments, historySearch, sourceFilter]);

  // Paginated History
  const totalHistoryPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, historyPage]);

  // Modal Handlers
  const openRecordPaymentModal = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.balanceAmount > 0 ? String(bill.balanceAmount) : "");
    setPaymentMethod("UPI");
    setReferenceNo("");
    setPaymentDescription("");
    setPaymentError(null);
  };

  const closeRecordPaymentModal = () => {
    setSelectedBill(null);
    setPaymentAmount("");
    setPaymentMethod("UPI");
    setReferenceNo("");
    setPaymentDescription("");
    setPaymentError(null);
  };

  const handleRecordPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBill) return;

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Payment amount must be greater than 0.");
      return;
    }

    if (amount > selectedBill.balanceAmount) {
      setPaymentError(
        `Payment amount cannot exceed remaining balance of ${formatCurrency(selectedBill.balanceAmount)}.`
      );
      return;
    }

    setPaymentError(null);
    paymentMutation.mutate({
      billId: selectedBill._id,
      amount,
      method: paymentMethod,
      refNo: referenceNo.trim() || undefined,
      desc: paymentDescription.trim() || undefined,
    });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payments
            </h1>
            <p className="text-sm text-slate-500">
              Track maintenance dues, search by resident or unit, and record verified receipts.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paymentSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accent}`} />
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

        {/* Section 1: Payment Records (Dues & Invoices) */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment Records
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Resident bills, current balances, and payment collection.
                </p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recordsSearch}
                    onChange={(e) => {
                      setRecordsSearch(e.target.value);
                      setRecordsPage(1);
                    }}
                    placeholder="Search resident or flat..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F] focus:bg-white"
                  />
                  {recordsSearch ? (
                    <button
                      type="button"
                      onClick={() => setRecordsSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setRecordsPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#07584F]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto p-5 sm:p-6">
            {billsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading bills...
              </p>
            ) : billsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(billsQuery.error)}
              </p>
            ) : filteredBills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No matching payment records found
                </p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search keyword or status filter.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Resident</th>
                    <th className="pb-3">Flat / Unit</th>
                    <th className="pb-3">Total Bill</th>
                    <th className="pb-3">Paid</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBills.map((bill) => {
                    const residentDisplayName = bill.residentName || "Resident";
                    const unitDisplayName =
                      bill.unitName || (bill.flatNumber ? `Flat ${bill.flatNumber}` : "Unit");

                    return (
                      <tr
                        key={bill._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07584F]/10 text-xs font-bold text-[#07584F]">
                              {residentDisplayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-semibold text-slate-900">
                                {residentDisplayName}
                              </span>
                              <span className="block text-[11px] text-slate-400">
                                Bill #{bill._id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                            <Building className="h-3.5 w-3.5 text-slate-500" />
                            {unitDisplayName}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-900">
                          {formatCurrency(bill.totalAmount, 2)}
                        </td>
                        <td className="py-3.5 font-medium text-emerald-700">
                          {formatCurrency(bill.paidAmount, 2)}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-900">
                          {bill.balanceAmount > 0 ? (
                            <span className="text-amber-700">
                              {formatCurrency(bill.balanceAmount, 2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {formatDate(bill.dueDate)}
                        </td>
                        <td className="py-3.5">
                          <span className={statusClassNames[bill.status]}>
                            {statusLabels[bill.status]}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailBill(bill)}
                              title="View Bill Breakdown"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {bill.balanceAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => openRecordPaymentModal(bill)}
                                className="rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptModalData({
                                    receiptId: `REC-${bill._id.slice(-6).toUpperCase()}`,
                                    billId: bill._id,
                                    residentName: residentDisplayName,
                                    unitName: unitDisplayName,
                                    amount: bill.paidAmount,
                                    paymentMethod: "Settled",
                                    paidAt: bill.updatedAt || bill.dueDate,
                                    balanceRemaining: 0,
                                    totalBillAmount: bill.totalAmount,
                                  });
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                <Receipt className="h-3 w-3" />
                                Receipt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination for Bills */}
            {filteredBills.length > ITEMS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(recordsPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(recordsPage * ITEMS_PER_PAGE, filteredBills.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredBills.length}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={recordsPage === 1}
                    onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {recordsPage} of {totalBillPages}
                  </span>
                  <button
                    type="button"
                    disabled={recordsPage === totalBillPages}
                    onClick={() => setRecordsPage((p) => Math.min(totalBillPages, p + 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Section 2: Payment History */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment History
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Persisted record of manual collections and automatic wallet settlements.
                </p>
              </div>

              {/* Search & Source Filter */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    placeholder="Search resident or flat..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F] focus:bg-white"
                  />
                  {historySearch ? (
                    <button
                      type="button"
                      onClick={() => setHistorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#07584F]"
                >
                  <option value="ALL">All Sources</option>
                  <option value="MANUAL">Manual</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto p-5 sm:p-6">
            {paymentsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading payment history...
              </p>
            ) : paymentsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(paymentsQuery.error)}
              </p>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No payment transactions recorded
                </p>
                <p className="text-xs text-slate-500">
                  Recorded payments and wallet debits will be displayed here.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Flat / Unit</th>
                    <th className="pb-3">Resident</th>
                    <th className="pb-3">Bill Ref</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.map((payment) => {
                    const residentDisplayName = payment.residentName || "Resident";
                    const unitDisplayName =
                      payment.unitName || (payment.flatNumber ? `Flat ${payment.flatNumber}` : "Unit");

                    return (
                      <tr
                        key={payment._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="py-3.5 text-slate-600">
                          {formatDate(payment.paidAt)}
                        </td>
                        <td className="py-3.5 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                            {unitDisplayName}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-slate-900">
                          {residentDisplayName}
                        </td>
                        <td className="py-3.5 font-mono text-xs text-slate-500">
                          #{payment.billId.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 font-semibold text-emerald-700">
                          {formatCurrency(payment.amount, 2)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              payment.source === "WALLET"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {payment.source === "WALLET" ? (
                              <Wallet className="h-3 w-3" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            {payment.source}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptModalData({
                                receiptId: `REC-${payment._id.slice(-6).toUpperCase()}`,
                                billId: payment.billId,
                                residentName: residentDisplayName,
                                unitName: unitDisplayName,
                                amount: payment.amount,
                                paymentMethod: payment.source === "WALLET" ? "Wallet Credit" : "Manual Payment",
                                referenceNo: payment.description || undefined,
                                paidAt: payment.paidAt,
                                balanceRemaining: 0,
                                totalBillAmount: payment.amount,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            <Receipt className="h-3 w-3 text-slate-500" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination for History */}
            {filteredPayments.length > ITEMS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(historyPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(historyPage * ITEMS_PER_PAGE, filteredPayments.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredPayments.length}
                  </span>{" "}
                  payments
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {historyPage} of {totalHistoryPages}
                  </span>
                  <button
                    type="button"
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Record Payment
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedBill.unitName || `Flat ${selectedBill.flatNumber || ""}`} •{" "}
                  {selectedBill.residentName || "Resident"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRecordPaymentModal}
                aria-label="Close record payment modal"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="space-y-4 p-6">
                {paymentError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {paymentError}
                  </p>
                ) : null}

                {/* Account Balances Card */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                  <div>
                    <span className="text-slate-400">Total Bill:</span>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(selectedBill.totalAmount, 2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Already Paid:</span>
                    <p className="font-semibold text-emerald-700">
                      {formatCurrency(selectedBill.paidAmount, 2)}
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/80 pt-2 flex items-center justify-between">
                    <span className="font-medium text-slate-600">Remaining Balance:</span>
                    <span className="text-sm font-bold text-[#07584F]">
                      {formatCurrency(selectedBill.balanceAmount, 2)}
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="paymentAmount"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Payment Amount (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(selectedBill.balanceAmount))}
                      className="text-xs font-semibold text-[#07584F] hover:underline"
                    >
                      Pay Full (₹{selectedBill.balanceAmount})
                    </button>
                  </div>
                  <input
                    id="paymentAmount"
                    type="number"
                    min="0.01"
                    max={selectedBill.balanceAmount}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#07584F]"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="paymentMethod"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Payment Method
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#07584F]"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reference No */}
                  <div>
                    <label
                      htmlFor="referenceNo"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Reference / UTR No.
                    </label>
                    <input
                      id="referenceNo"
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="Optional reference"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="paymentDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Notes / Memo (Optional)
                  </label>
                  <input
                    id="paymentDescription"
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="e.g. Cleared by resident via Google Pay"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeRecordPaymentModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="rounded-lg bg-[#07584F] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#064e46] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentMutation.isPending ? "Recording..." : "Confirm & Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Receipt Modal */}
      {receiptModalData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#07584F] text-white">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Payment Receipt</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {receiptModalData.receiptId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalData(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-6 space-y-4">
              {/* Receipt Body */}
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Amount Received
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[#07584F]">
                  {formatCurrency(receiptModalData.amount, 2)}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Payment
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Resident:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptModalData.residentName}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Unit / Flat:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptModalData.unitName}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Payment Date:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(receiptModalData.paidAt)}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptModalData.paymentMethod}
                  </span>
                </div>
                {receiptModalData.referenceNo ? (
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Reference No:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {receiptModalData.referenceNo}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(receiptModalData.balanceRemaining, 2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalData(null)}
                className="flex-1 rounded-lg bg-[#07584F] py-2.5 text-xs font-semibold text-white hover:bg-[#064e46]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bill Details Modal */}
      {detailBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Bill Breakdown</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    #{detailBill._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailBill(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Resident:</span>
                <span className="font-semibold text-slate-900">
                  {detailBill.residentName || "Resident"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Unit / Flat:</span>
                <span className="font-semibold text-slate-900">
                  {detailBill.unitName || (detailBill.flatNumber ? `Flat ${detailBill.flatNumber}` : "Unit")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Amount:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(detailBill.baseAmount, 2)}
                </span>
              </div>
              {detailBill.additionalCharges?.length ? (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 block mb-1">Additional Charges:</span>
                  {detailBill.additionalCharges.map((c, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-600 pl-2">
                      <span>• {c.title}</span>
                      <span>{formatCurrency(c.amount, 2)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Late Fee:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(detailBill.lateFeeAmount, 2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(detailBill.totalAmount, 2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(detailBill.paidAmount, 2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Remaining Balance:</span>
                <span className="text-sm font-bold text-[#07584F]">
                  {formatCurrency(detailBill.balanceAmount, 2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(detailBill.dueDate)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailBill(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
