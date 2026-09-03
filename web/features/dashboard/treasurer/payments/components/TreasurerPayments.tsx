"use client";

import { FormEvent, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getBills,
  getPayments,
  recordBillPayment,
  type Bill,
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
    "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700",
  PARTIALLY_PAID:
    "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700",
  PAID:
    "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700",
  OVERDUE:
    "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700",
};

export default function TreasurerPayments() {
  const queryClient = useQueryClient();
  const [selectedBill, setSelectedBill] =
    useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] =
    useState<string | null>(null);

  const billsQuery = useQuery({
    queryKey: ["treasurer", "bills"],
    queryFn: () => getBills(),
  });
  const paymentsQuery = useQuery({
    queryKey: ["treasurer", "payments"],
    queryFn: () => getPayments({ limit: 100 }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
    }: {
      billId: string;
      amount: number;
    }) => recordBillPayment(billId, amount),
    onSuccess: async () => {
      toast.success("Payment recorded.");
      closeRecordPaymentModal();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["treasurer", "bills"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["treasurer", "payments"],
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
    },
    onError: (error) => {
      const message = getSafeErrorMessage(error);
      setPaymentError(message);
      toast.error(message);
    },
  });

  const bills = billsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const totalCollected = bills.reduce(
    (total, bill) => total + bill.paidAmount,
    0,
  );
  const pendingAmount = bills
    .filter((bill) => bill.status !== "PAID")
    .reduce((total, bill) => total + bill.balanceAmount, 0);
  const completedPayments = bills.filter(
    (bill) => bill.status === "PAID",
  ).length;
  const pendingBillCount = bills.filter(
    (bill) => bill.balanceAmount > 0,
  ).length;
  const paymentSummary = [
    {
      title: "Total Collected",
      value: formatCurrency(totalCollected, 2),
      icon: CircleDollarSign,
    },
    {
      title: "Pending Amount",
      value: formatCurrency(pendingAmount, 2),
      icon: Clock3,
    },
    {
      title: "Completed Payments",
      value: completedPayments.toString(),
      icon: CheckCircle2,
    },
    {
      title: "Pending Payments",
      value: pendingBillCount.toString(),
      icon: CreditCard,
    },
  ];

  const openRecordPaymentModal = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount("");
    setPaymentError(null);
  };

  const closeRecordPaymentModal = () => {
    setSelectedBill(null);
    setPaymentAmount("");
    setPaymentError(null);
  };

  const handleRecordPayment = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedBill) {
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Payment amount must be greater than 0.");
      return;
    }

    if (amount > selectedBill.balanceAmount) {
      setPaymentError(
        "Payment amount cannot exceed the remaining balance.",
      );
      return;
    }

    setPaymentError(null);
    paymentMutation.mutate({
      billId: selectedBill._id,
      amount,
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track resident bill payments and record payment amounts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paymentSummary.map((item) => {
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
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View bill balances and record payments against outstanding
              bills.
            </p>
          </div>

          <div className="overflow-x-auto p-6">
            {billsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading payments...
              </p>
            ) : billsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(billsQuery.error)}
              </p>
            ) : bills.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No payment records available.
              </p>
            ) : (
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Resident ID</th>
                    <th className="pb-3 font-medium">Unit ID</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Paid</th>
                    <th className="pb-3 font-medium">Balance</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {bill.residentId}
                      </td>
                      <td className="py-4 text-slate-600">
                        {bill.unitId}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        {formatCurrency(bill.totalAmount, 2)}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.paidAmount, 2)}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.balanceAmount, 2)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatDate(bill.dueDate)}
                      </td>
                      <td className="py-4">
                        <span className={statusClassNames[bill.status]}>
                          {statusLabels[bill.status]}
                        </span>
                      </td>
                      <td className="py-4">
                        {bill.balanceAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openRecordPaymentModal(bill)
                            }
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                          >
                            Record Payment
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Paid
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Persisted manual and wallet payment activity.
            </p>
          </div>
          <div className="overflow-x-auto p-6">
            {paymentsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading payment history...
              </p>
            ) : paymentsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(paymentsQuery.error)}
              </p>
            ) : payments.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No payment history recorded yet.
              </p>
            ) : (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Bill</th>
                    <th className="pb-3 font-medium">Resident</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 text-slate-600">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {payment.billId}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {payment.residentId}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        {formatCurrency(payment.amount, 2)}
                      </td>
                      <td className="py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {payment.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Record Payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the amount received for this bill.
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
              <div className="space-y-5 p-6">
                {paymentError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {paymentError}
                  </p>
                ) : null}

                <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Remaining Balance
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(selectedBill.balanceAmount, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Already Paid
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(selectedBill.paidAmount, 2)}
                    </dd>
                  </div>
                </dl>

                <label
                  htmlFor="paymentAmount"
                  className="block text-sm font-medium text-slate-700"
                >
                  Payment Amount
                </label>
                <input
                  id="paymentAmount"
                  type="number"
                  min="0.01"
                  max={selectedBill.balanceAmount}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeRecordPaymentModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {paymentMutation.isPending
                    ? "Recording..."
                    : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
