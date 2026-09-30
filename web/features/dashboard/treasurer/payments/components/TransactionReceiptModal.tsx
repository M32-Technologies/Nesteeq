"use client";

import React, { useRef } from "react";
import { Printer, X, CheckCircle2, Building2, AlertTriangle } from "lucide-react";
import type { Payment } from "../../services/treasurer.service";
import { formatCurrency, formatDate } from "../../utils/format";

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export default function TransactionReceiptModal({
  isOpen,
  onClose,
  payment,
}: TransactionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const receiptNo =
    payment.receiptNumber ||
    `REC-${payment._id.slice(-6).toUpperCase()}`;

  const isReversed = payment.reversed;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Bar - Hidden in print */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            {isReversed ? (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            {isReversed ? "Reversed Payment Record" : "Official Society Collection Receipt"}
          </div>
          <div className="flex items-center gap-2">
            {!isReversed && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-8 print:p-6 text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-white print:border print:border-slate-900">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    Apartment Owners Association
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Official Society Maintenance & Billing Receipt
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {isReversed ? (
                <span className="inline-block rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 uppercase tracking-wider">
                  Reversed / Cancelled
                </span>
              ) : (
                <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-wider print:border-emerald-600">
                  Official Receipt
                </span>
              )}
              <p className="mt-1 text-xs font-mono font-bold text-slate-600">
                Receipt #{receiptNo}
              </p>
              <p className="text-[11px] text-slate-400">
                Date: {formatDate(payment.paidAt)}
              </p>
            </div>
          </div>

          {/* Reversal Banner if reversed */}
          {isReversed && (
            <div className="my-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                This payment was reversed and marked void.
              </p>
              {payment.reversalReason && (
                <p className="mt-1 text-rose-700">
                  <span className="font-medium">Reason for reversal:</span>{" "}
                  {payment.reversalReason}
                </p>
              )}
              {payment.reversedAt && (
                <p className="mt-0.5 text-[11px] text-rose-500">
                  Reversed on: {formatDate(payment.reversedAt)}
                </p>
              )}
            </div>
          )}

          {/* Resident & Bill Info Grid */}
          <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Paid By (Resident & Flat)
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {payment.unitName || (payment.flatNumber ? `Flat ${payment.flatNumber}` : "Apartment Unit")}
              </p>
              <p className="text-slate-600 font-medium">
                {payment.residentName || "Resident"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Payment Purpose / Bill
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {payment.billTitle || "Society Maintenance Fee"}
              </p>
              {payment.billingPeriod && (
                <p className="text-slate-600 font-medium">
                  Period: <span className="font-mono">{payment.billingPeriod}</span>
                </p>
              )}
              <p className="text-slate-500 text-[11px]">
                Transaction ID: <span className="font-mono">{payment._id.slice(-8).toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Payment Breakdown & Mode */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="pb-2">Particulars / Mode</th>
                  <th className="pb-2">Reference / Details</th>
                  <th className="pb-2 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-medium text-slate-800">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      {payment.paymentMethod || "Direct Payment"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 font-mono">
                    {payment.referenceNo ? `UTR / Ref: ${payment.referenceNo}` : (payment.description || "Direct Society Collection")}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary Box */}
          <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div className="flex justify-between py-1 text-emerald-700 font-bold text-base">
              <span>Total Amount Credited:</span>
              <span className="font-mono">{formatCurrency(payment.amount)}</span>
            </div>
            {payment.billBalanceAmount !== undefined && (
              <div className="flex justify-between py-1 text-slate-600 border-t border-slate-200/60 mt-1 pt-1.5">
                <span>Remaining Bill Balance:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(payment.billBalanceAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Stamp & Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-end justify-between">
            <div className="text-[11px] text-slate-400 max-w-xs">
              <p className="font-medium text-slate-600">Note:</p>
              <p>
                Computer-generated receipt verified by Nesteeq Apartment Management System. Retain this acknowledgment for society accounts reconciliation.
              </p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300 w-36 ml-auto mb-1"></div>
              <p className="text-[11px] font-semibold text-slate-700">
                Treasurer Signature
              </p>
              <p className="text-[10px] text-slate-400">
                Society Accounts Office
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
