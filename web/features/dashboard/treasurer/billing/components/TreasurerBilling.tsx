"use client";

import { FormEvent, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CircleDollarSign,
  Clock3,
  FileText,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBill,
  getBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
  type Bill,
  type CreateBillPayload,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import CreateBillModal from "./CreateBillModal";

type BillAction = "payment" | "waiver" | "edit";

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

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the billing request.";

const toDateInput = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

export default function TreasurerBilling() {
  const queryClient = useQueryClient();
  const [isCreateBillOpen, setIsCreateBillOpen] =
    useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(
    null,
  );
  const [action, setAction] = useState<BillAction | null>(null);
  const [amount, setAmount] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("");
  const [actionError, setActionError] = useState<string | null>(
    null,
  );

  const billsQuery = useQuery({
    queryKey: ["treasurer", "bills"],
    queryFn: () => getBills(),
  });

  const invalidateTreasurerData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "bills"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "finance-summary"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "monthly-finance"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "payments"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "wallets"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "audit"],
      }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: async () => {
      toast.success("Bill created.");
      setIsCreateBillOpen(false);
      await invalidateTreasurerData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      billId,
      paymentAmount,
    }: {
      billId: string;
      paymentAmount: number;
    }) => recordBillPayment(billId, paymentAmount),
    onSuccess: async () => {
      toast.success("Payment recorded.");
      closeActionModal();
      await invalidateTreasurerData();
    },
    onError: (error) => {
      setActionError(getSafeErrorMessage(error));
    },
  });

  const waiverMutation = useMutation({
    mutationFn: ({
      billId,
      waiverAmount,
    }: {
      billId: string;
      waiverAmount: number;
    }) => waiveLateFee(billId, waiverAmount),
    onSuccess: async () => {
      toast.success("Late fee waived.");
      closeActionModal();
      await invalidateTreasurerData();
    },
    onError: (error) => {
      setActionError(getSafeErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      billId,
      payload,
    }: {
      billId: string;
      payload: {
        baseAmount: number;
        dueDate: string;
        lateFeePerDay: number;
      };
    }) => updateBill(billId, payload),
    onSuccess: async () => {
      toast.success("Bill updated.");
      closeActionModal();
      await invalidateTreasurerData();
    },
    onError: (error) => {
      setActionError(getSafeErrorMessage(error));
    },
  });

  const openActionModal = (bill: Bill, nextAction: BillAction) => {
    setSelectedBill(bill);
    setAction(nextAction);
    setAmount("");
    setActionError(null);
    setBaseAmount(String(bill.baseAmount));
    setDueDate(toDateInput(bill.dueDate));
    setLateFeePerDay(String(bill.lateFeePerDay));
  };

  const closeActionModal = () => {
    setSelectedBill(null);
    setAction(null);
    setAmount("");
    setActionError(null);
    setBaseAmount("");
    setDueDate("");
    setLateFeePerDay("");
  };

  const handleCreateBill = async (
    payload: CreateBillPayload,
  ) => {
    await createMutation.mutateAsync(payload);
  };

  const handleActionSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedBill || !action) {
      return;
    }

    setActionError(null);

    if (action === "payment" || action === "waiver") {
      const parsedAmount = Number(amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setActionError("Amount must be greater than 0.");
        return;
      }

      if (
        action === "payment" &&
        parsedAmount > selectedBill.balanceAmount
      ) {
        setActionError(
          "Payment amount cannot exceed the bill balance.",
        );
        return;
      }

      if (action === "payment") {
        paymentMutation.mutate({
          billId: selectedBill._id,
          paymentAmount: parsedAmount,
        });
      } else {
        waiverMutation.mutate({
          billId: selectedBill._id,
          waiverAmount: parsedAmount,
        });
      }

      return;
    }

    const parsedBaseAmount = Number(baseAmount);
    const parsedLateFeePerDay = Number(lateFeePerDay);

    if (
      !Number.isFinite(parsedBaseAmount) ||
      parsedBaseAmount <= 0 ||
      !Number.isFinite(parsedLateFeePerDay) ||
      parsedLateFeePerDay < 0 ||
      !dueDate
    ) {
      setActionError(
        "Base amount, due date and late fee are required.",
      );
      return;
    }

    updateMutation.mutate({
      billId: selectedBill._id,
      payload: {
        baseAmount: parsedBaseAmount,
        dueDate,
        lateFeePerDay: parsedLateFeePerDay,
      },
    });
  };

  const bills = billsQuery.data ?? [];
  const billingStats = bills.reduce(
    (stats, bill) => {
      stats.collected += bill.paidAmount;
      stats.outstanding += bill.balanceAmount;

      if (bill.status === "OVERDUE") {
        stats.overdue += bill.balanceAmount;
      }

      return stats;
    },
    {
      collected: 0,
      outstanding: 0,
      overdue: 0,
    },
  );
  const billingSummary = [
    {
      title: "Total Bills",
      value: bills.length.toString(),
      icon: FileText,
    },
    {
      title: "Collected",
      value: formatCurrency(billingStats.collected),
      icon: CircleDollarSign,
    },
    {
      title: "Outstanding",
      value: formatCurrency(billingStats.outstanding),
      icon: Clock3,
    },
    {
      title: "Overdue",
      value: formatCurrency(billingStats.overdue),
      icon: TriangleAlert,
    },
  ];
  const isMutating =
    paymentMutation.isPending ||
    waiverMutation.isPending ||
    updateMutation.isPending;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Billing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage maintenance bills, dues, due dates and late fees.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {billingSummary.map((item) => {
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
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Maintenance Bills
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View resident bills and outstanding balances.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateBillOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Create Bill
            </button>
          </div>

          <div className="overflow-x-auto p-6">
            {billsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading bills...
              </p>
            ) : billsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(billsQuery.error)}
              </p>
            ) : bills.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No bills available.
              </p>
            ) : (
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Resident ID</th>
                    <th className="pb-3 font-medium">Unit ID</th>
                    <th className="pb-3 font-medium">Base</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Late Fee</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Paid</th>
                    <th className="pb-3 font-medium">Balance</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
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
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.baseAmount)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatDate(bill.dueDate)}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.lateFeeAmount)}
                      </td>
                      <td className="py-4 font-semibold text-slate-900">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.paidAmount)}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(bill.balanceAmount)}
                      </td>
                      <td className="py-4">
                        <span className={statusClassNames[bill.status]}>
                          {statusLabels[bill.status]}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openActionModal(bill, "edit")}
                            disabled={bill.status === "PAID"}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(bill, "payment")}
                            disabled={bill.balanceAmount <= 0}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Record
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(bill, "waiver")}
                            disabled={
                              bill.lateFeeAmount - bill.lateFeeWaivedAmount <=
                              0
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Waive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        onCreate={handleCreateBill}
      />

      {selectedBill && action ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {action === "payment"
                    ? "Record Payment"
                    : action === "waiver"
                      ? "Waive Late Fee"
                      : "Edit Bill"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bill {selectedBill._id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeActionModal}
                aria-label="Close billing action modal"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit}>
              <div className="space-y-5 p-6">
                {actionError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {actionError}
                  </p>
                ) : null}

                {action === "edit" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Base Amount
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={baseAmount}
                        onChange={(event) =>
                          setBaseAmount(event.target.value)
                        }
                        required
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Late Fee Per Day
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lateFeePerDay}
                        onChange={(event) =>
                          setLateFeePerDay(event.target.value)
                        }
                        required
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                      Due Date
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(event) =>
                          setDueDate(event.target.value)
                        }
                        required
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="text-sm font-medium text-slate-700">
                    Amount
                    <input
                      type="number"
                      min="0.01"
                      max={
                        action === "payment"
                          ? selectedBill.balanceAmount
                          : Math.max(
                              0,
                              selectedBill.lateFeeAmount -
                                selectedBill.lateFeeWaivedAmount,
                            )
                      }
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isMutating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
