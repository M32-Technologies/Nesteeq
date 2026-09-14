import { X } from "lucide-react";
import { formatCurrency, formatDate } from "@/features/dashboard/treasurer/utils/format";
import { Bill, BillStatus, Payment } from "../types/payment-history";
import { Portal } from "@/components/portal";

const statusLabels: Record<BillStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

const statusClassNames: Record<BillStatus, string> = {
  PENDING:
    "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700",
  PARTIALLY_PAID:
    "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700",
  PAID:
    "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700",
  OVERDUE:
    "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700",
};

interface PaymentDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  bill?: Bill | null;
  payment?: Payment | null;
  residentName?: string;
  flatNumber?: string;
}

export default function PaymentDetailsSheet({
  open,
  onClose,
  bill,
  payment,
  residentName,
  flatNumber,
}: PaymentDetailsSheetProps) {
  if (!open || (!bill && !payment)) {
    return null;
  }

  const title = bill ? "Bill Details" : "Transaction Details";
  const subtitle = bill
    ? "Review the resident bill and payment breakdown."
    : "Review the transaction details.";

  return (
    <Portal>
      {/* Backdrop */}
      <div
        style={{ zIndex: 999 }}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{ zIndex: 1000, height: "100dvh" }}
        className="fixed inset-y-0 right-0 bottom-0 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl animate-in slide-in-from-right sm:max-w-md"
      >
        <div className="flex items-center justify-between pb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Identity Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Resident
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {residentName ?? (bill?.residentId || payment?.residentId)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Flat / Unit
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {flatNumber ?? (bill?.unitId || payment?.unitId)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Bill View */}
          {bill && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">Status</span>
                <span className={statusClassNames[bill.status]}>
                  {statusLabels[bill.status]}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Due Date
                </span>
                <span className="text-sm text-slate-900">
                  {formatDate(bill.dueDate)}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Financial Breakdown
                </h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Base Amount</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(bill.baseAmount, 2)}
                  </span>
                </div>

                {bill.additionalCharges && bill.additionalCharges.length > 0 ? (
                  bill.additionalCharges.map((charge, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-600">{charge.title}</span>
                        {charge.reason && (
                          <span className="text-xs text-slate-400">
                            {charge.reason}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(charge.amount, 2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No additional charges</div>
                )}

                {bill.lateFeeAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-amber-600">
                    <span>Late Fee</span>
                    <span className="font-medium">
                      {formatCurrency(bill.lateFeeAmount, 2)}
                    </span>
                  </div>
                )}
                {bill.lateFeeWaivedAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Late Fee Waived</span>
                    <span className="font-medium">
                      -{formatCurrency(bill.lateFeeWaivedAmount, 2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Total Amount
                  </span>
                  <span className="text-base font-semibold text-slate-900">
                    {formatCurrency(bill.totalAmount, 2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Paid Amount
                  </span>
                  <span className="text-base font-medium text-emerald-600">
                    {formatCurrency(bill.paidAmount, 2)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-semibold text-slate-900">
                    Outstanding Balance
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(bill.balanceAmount, 2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment View */}
          {payment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Payment Ref
                </span>
                <span className="text-sm font-medium text-slate-900">
                  #{payment._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Bill Ref
                </span>
                <span className="text-sm font-medium text-slate-900">
                  #{payment.billId.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Amount
                </span>
                <span className="text-base font-semibold text-emerald-600">
                  {formatCurrency(payment.amount, 2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Source
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {payment.source}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-medium text-slate-500">
                  Paid At
                </span>
                <span className="text-sm text-slate-900">
                  {formatDate(payment.paidAt)}
                </span>
              </div>
              {payment.description && (
                <div className="space-y-1 pb-4">
                  <span className="block text-sm font-medium text-slate-500">
                    Description
                  </span>
                  <p className="text-sm text-slate-900">{payment.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Portal>
  );
}
