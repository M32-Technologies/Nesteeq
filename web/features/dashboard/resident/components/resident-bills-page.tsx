"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Receipt,
  ArrowRight,
  X,
  Wallet,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";
import {
  fetchResidentBills,
  payResidentBill,
  type ResidentBillItem,
} from "../api/resident-dashboard.api";

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const PAYMENT_MODES = [
  { id: "UPI", label: "Instant UPI (GPay / PhonePe / Paytm)", icon: "⚡" },
  { id: "NETBANKING", label: "Net Banking (NEFT / IMPS)", icon: "🏦" },
  { id: "CARD", label: "Credit / Debit Card", icon: "💳" },
  { id: "WALLET", label: "Resident Society Advance Wallet", icon: "👛" },
];

export function ResidentBillsPage() {
  const queryClient = useQueryClient();
  const { apartmentName, flatUnitName } = useResidentDashboard();

  const [selectedBill, setSelectedBill] = useState<ResidentBillItem | null>(null);
  const [payingBill, setPayingBill] = useState<ResidentBillItem | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const {
    data: billsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["resident", "bills"],
    queryFn: fetchResidentBills,
  });

  const summary = billsData?.summary || {
    totalOutstanding: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0,
    lateFees: 0,
  };

  const bills = billsData?.bills || [];
  const recentPayments = billsData?.recentPayments || [];

  const payMutation = useMutation({
    mutationFn: async ({
      billId,
      amount,
      paymentMethod,
      referenceNo,
      description,
    }: {
      billId: string;
      amount: number;
      paymentMethod: string;
      referenceNo?: string;
      description?: string;
    }) => {
      return payResidentBill(billId, {
        amount,
        paymentMethod,
        referenceNo,
        description,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Payment processed and confirmed!");
      setPayingBill(null);
      setPaymentRef("");
      setPaymentNotes("");
      queryClient.invalidateQueries({ queryKey: ["resident", "bills"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "profile"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to process payment."
      );
    },
  });

  const handleOpenPay = (bill: ResidentBillItem) => {
    setPayingBill(bill);
    setPaymentMode("UPI");
    setPaymentRef(`UPI-${Date.now().toString().slice(-6)}`);
    setPaymentNotes("");
  };

  const handleConfirmPay = () => {
    if (!payingBill) return;
    payMutation.mutate({
      billId: payingBill._id,
      amount: payingBill.balanceAmount,
      paymentMethod: paymentMode,
      referenceNo: paymentRef.trim() || undefined,
      description: paymentNotes.trim() || undefined,
    });
  };

  // Oldest unpaid bill for Quick Pay button
  const pendingBillToPay = bills.find(
    (b) => b.balanceAmount > 0 && (b.status === "OVERDUE" || b.status === "PENDING" || b.status === "PARTIALLY_PAID")
  );

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Bills & Society Finance
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Review monthly maintenance invoices and payment receipts for{" "}
            <span className="font-semibold text-[#111111]">{flatUnitName}</span> at{" "}
            <span className="font-semibold text-[#111111]">{apartmentName}</span>.
          </p>
        </div>

        {summary.totalOutstanding > 0 && pendingBillToPay ? (
          <button
            type="button"
            onClick={() => handleOpenPay(pendingBillToPay)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <CreditCard className="size-4" />
            <span>Pay Dues ({formatCurrency(summary.totalOutstanding)})</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>All Dues Cleared</span>
          </div>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              summary.totalOutstanding > 0
                ? summary.overdueCount > 0
                  ? "bg-red-500"
                  : "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Total Outstanding
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.totalOutstanding)}
          </h3>
          <p
            className={`text-xs font-medium mt-1 flex items-center gap-1 ${
              summary.totalOutstanding > 0 ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {summary.totalOutstanding > 0 ? (
              <>
                <AlertTriangle className="size-3.5" />
                <span>
                  {summary.pendingCount} pending bill
                  {summary.pendingCount > 1 ? "s" : ""}{" "}
                  {summary.overdueCount > 0 ? `(${summary.overdueCount} overdue)` : ""}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>All dues cleared for {flatUnitName}</span>
              </>
            )}
          </p>
        </div>

        {/* Total Settled */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Total Paid & Settled
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.totalPaid)}
          </h3>
          <p className="text-xs text-blue-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>Lifetime receipts recorded</span>
          </p>
        </div>

        {/* Accrued Late Fees */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Accrued Late Fee
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.lateFees)}
          </h3>
          <p className="text-xs text-[#637083] font-medium mt-1">
            {summary.lateFees > 0 ? "Penalty for overdue dates" : "Zero penalty accrued"}
          </p>
        </div>

        {/* Billing Policy */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#07584F]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Billing Cycle
          </span>
          <h3 className="text-base font-bold text-[#111111] mt-2">
            1st - 5th of Month
          </h3>
          <p className="text-xs text-[#637083] font-medium mt-1">
            Managed by Society Treasurer
          </p>
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#DDE3DF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#111111]">
              Maintenance Invoices & Bills
            </h2>
            <p className="text-xs text-[#637083] mt-0.5">
              Directly synced with the Society Treasurer ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-[#07584F] font-semibold hover:underline self-start sm:self-auto"
          >
            Refresh Statements
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#637083]">
            Loading billing statements...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            Unable to fetch billing statements. Please check your network or try again later.
          </div>
        ) : bills.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
            <p className="text-base font-semibold text-[#111111]">
              Zero Pending Invoices
            </p>
            <p className="text-xs text-[#637083] max-w-sm mx-auto">
              Your society treasurer has not generated any unpaid bills for {flatUnitName}. When a new maintenance cycle starts, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Bill / Cycle</th>
                  <th className="px-5 py-3">Base Amount</th>
                  <th className="px-5 py-3">Additional Charges</th>
                  <th className="px-5 py-3">Late Fee</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Balance Due</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const isPaid = bill.status === "PAID";
                  const isOverdue = bill.status === "OVERDUE";
                  const isPending = bill.status === "PENDING" || bill.status === "PARTIALLY_PAID";

                  return (
                    <tr key={bill._id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          Maintenance Cycle
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          #{bill._id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {formatCurrency(bill.baseAmount)}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {bill.additionalCharges && bill.additionalCharges.length > 0 ? (
                          <div className="space-y-0.5">
                            {bill.additionalCharges.map((c, i) => (
                              <div key={i} className="text-[11px] text-slate-500">
                                {c.title}: <span className="font-medium text-slate-700">{formatCurrency(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-amber-700">
                        {bill.lateFeeAmount > 0 ? formatCurrency(bill.lateFeeAmount) : "₹0"}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatCurrency(bill.totalAmount)}
                      </td>

                      <td className="px-5 py-4 font-bold text-lg">
                        <span
                          className={
                            bill.balanceAmount > 0
                              ? isOverdue
                                ? "text-red-600"
                                : "text-amber-700"
                              : "text-emerald-700"
                          }
                        >
                          {formatCurrency(bill.balanceAmount)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>{formatDate(bill.dueDate)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isOverdue
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {bill.balanceAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPay(bill)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064C44] cursor-pointer"
                          >
                            <CreditCard className="size-3.5" />
                            <span>Pay Dues</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-4" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Receipts & Payment History */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#DDE3DF] p-5 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111111]">
              Recent Receipts & Payment History
            </h2>
            <p className="text-xs text-[#637083] mt-0.5">
              Reconciled real-time with the Society Treasurer desk.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {recentPayments.length} record{recentPayments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {recentPayments.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <Receipt className="size-6 text-[#7C8782] mx-auto" />
            <p className="text-sm font-semibold text-[#111111]">
              No Past Payments Recorded
            </p>
            <p className="text-xs text-[#637083] max-w-sm mx-auto">
              When you pay monthly society maintenance dues, your digital receipts will be available here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Receipt / Ref</th>
                  <th className="px-5 py-3">Amount Paid</th>
                  <th className="px-5 py-3">Payment Source</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <tr key={p._id} className="transition hover:bg-slate-50/60 text-xs">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                      REC-{p._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                        {p.source || "MANUAL"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      {p.description || "Maintenance settlement"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3.5" />
                        <span>Reconciled</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Dues Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#07584F] border border-emerald-200">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pay Society Maintenance Bill
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instant settlement recorded in Treasurer ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              {/* Bill Details Box */}
              <div className="rounded-xl bg-slate-50 p-3.5 text-slate-800 space-y-2 border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Unit:</span>
                  <span className="font-semibold text-slate-900">{flatUnitName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Reference:</span>
                  <span className="font-mono text-slate-700">
                    #{payingBill._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Date:</span>
                  <span className="font-medium text-slate-800">{formatDate(payingBill.dueDate)}</span>
                </div>
                {payingBill.lateFeeAmount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Accrued Late Fee:</span>
                    <span className="font-semibold">+{formatCurrency(payingBill.lateFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 items-baseline">
                  <span className="font-semibold text-slate-800 text-sm">Payable Amount:</span>
                  <span className="font-bold text-xl text-[#07584F]">
                    {formatCurrency(payingBill.balanceAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="space-y-1.5">
                  {PAYMENT_MODES.map((mode) => (
                    <label
                      key={mode.id}
                      className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition ${
                        paymentMode === mode.id
                          ? "border-[#07584F] bg-emerald-50/50 text-[#07584F] font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mode.icon}</span>
                        <span className="text-xs">{mode.label}</span>
                      </div>
                      <input
                        type="radio"
                        name="paymentMode"
                        value={mode.id}
                        checked={paymentMode === mode.id}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="text-[#07584F] focus:ring-[#07584F]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference / UTR Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-902188219"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via GooglePay"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={handleConfirmPay}
                className="rounded-lg bg-[#07584F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#064C44] transition cursor-pointer"
              >
                {payMutation.isPending ? "Processing..." : `Confirm & Pay ${formatCurrency(payingBill.balanceAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
