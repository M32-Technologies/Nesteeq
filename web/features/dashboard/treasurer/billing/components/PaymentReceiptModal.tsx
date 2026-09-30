"use client";

import React, { useRef } from "react";
import { Printer, X, CheckCircle2, Building2 } from "lucide-react";
import type { Bill } from "../types/billing.types";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return "N/A";
  try {
    return new Date(dateVal).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
};

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  bill,
}: PaymentReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const receiptNo = `REC-${bill._id.slice(-6).toUpperCase()}`;
  const isFullyPaid = bill.balanceAmount <= 0 || bill.status === "PAID";
  const displayDate = bill.settledAt || bill.updatedAt || bill.createdAt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Bar - Hidden in print */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Official Payment Receipt
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
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
              <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-wider print:border-emerald-600">
                {isFullyPaid ? "Fully Settled" : "Partial Payment"}
              </span>
              <p className="mt-1 text-xs font-mono font-bold text-slate-600">
                Receipt #{receiptNo}
              </p>
              <p className="text-[11px] text-slate-400">
                Date: {formatDate(displayDate)}
              </p>
            </div>
          </div>

          {/* Bill & Resident Info Grid */}
          <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed To (Flat & Resident)
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {bill.unitName || `Flat ${bill.flatNumber}`}
              </p>
              <p className="text-slate-600 font-medium">{bill.residentName}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Invoice Details
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {bill.title || bill.billType?.replace(/_/g, " ")}
              </p>
              {bill.billingPeriod && (
                <p className="text-slate-600 font-medium">
                  Billing Period: <span className="font-mono">{bill.billingPeriod}</span>
                </p>
              )}
              <p className="text-slate-500 text-[11px]">
                Due Date: {formatDate(bill.dueDate)}
              </p>
            </div>
          </div>

          {/* Charges Breakdown Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 font-medium text-slate-800">
                    Base Maintenance Charge
                  </td>
                  <td className="py-2 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(bill.baseAmount)}
                  </td>
                </tr>

                {bill.additionalCharges && bill.additionalCharges.length > 0 && (
                  bill.additionalCharges.map((ch, i) => (
                    <tr key={i}>
                      <td className="py-2 text-slate-700">
                        {ch.title} {ch.reason ? `(${ch.reason})` : ""}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-900">
                        {formatCurrency(ch.amount)}
                      </td>
                    </tr>
                  ))
                )}

                {bill.lateFeeAmount > 0 && (
                  <tr>
                    <td className="py-2 text-rose-600">
                      Late Fee (Fine)
                      {bill.lateFeeWaivedAmount > 0 && (
                        <span className="ml-1 text-[11px] text-emerald-600">
                          (₹{bill.lateFeeWaivedAmount} waived)
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-rose-600">
                      +{formatCurrency(Math.max(0, bill.lateFeeAmount - (bill.lateFeeWaivedAmount || 0)))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Summary Box */}
          <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Total Invoice Amount:</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(bill.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-emerald-700 font-bold border-t border-slate-200/60 mt-1 pt-1.5 text-sm">
              <span>Total Amount Paid / Received:</span>
              <span className="font-mono">{formatCurrency(bill.paidAmount)}</span>
            </div>
            {bill.balanceAmount > 0 ? (
              <div className="flex justify-between py-1 text-rose-600 font-medium">
                <span>Remaining Balance Due:</span>
                <span className="font-mono font-bold">{formatCurrency(bill.balanceAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between py-1 text-emerald-600 font-medium">
                <span>Remaining Balance Due:</span>
                <span className="font-mono font-bold">₹0.00 (Fully Settled)</span>
              </div>
            )}
          </div>

          {/* Stamp & Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-end justify-between">
            <div className="text-[11px] text-slate-400 max-w-xs">
              <p className="font-medium text-slate-600">Note:</p>
              <p>
                This is a verified digital payment receipt issued by Nesteeq. Please retain this for your records.
              </p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300 w-36 ml-auto mb-1"></div>
              <p className="text-[11px] font-semibold text-slate-700">
                Treasurer Signature
              </p>
              <p className="text-[10px] text-slate-400">
                Accounts & Audit Dept.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
