"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Layers,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBill,
  createCommonBill,
  getBills,
  getBillingSummary,
  recordBillPayment,
  updateBill,
  waiveLateFee,
  type Bill,
  type CreateBillPayload,
  type CreateCommonBillPayload,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import CreateBillModal from "./CreateBillModal";
import CreateCommonBillModal from "./CreateCommonBillModal";

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

const BILL_TYPE_TAGS: Record<
  string,
  { label: string; className: string }
> = {
  MONTHLY_MAINTENANCE: {
    label: "Monthly Maintenance",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  WATER: {
    label: "Water Bill",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  COMMON_ELECTRICITY: {
    label: "Common Electricity",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  LIFT_AMC: {
    label: "Lift AMC",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  SPECIAL_REPAIR: {
    label: "Special Repair",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  PARKING_MAINTENANCE: {
    label: "Parking Maintenance",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  OTHER: {
    label: "Custom Bill",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const ITEMS_PER_PAGE = 8;

const BILL_CATEGORY_FILTERS = [
  { value: "ALL", label: "All Bills" },
  { value: "MONTHLY_MAINTENANCE", label: "Maintenance" },
  { value: "WATER", label: "Water" },
  { value: "COMMON_ELECTRICITY", label: "Electricity" },
  { value: "LIFT_AMC", label: "Lift AMC" },
  { value: "SPECIAL_REPAIR", label: "Special Repair" },
  { value: "PARKING_MAINTENANCE", label: "Parking" },
  { value: "OTHER", label: "Other" },
];

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateBillOpen, setIsCreateBillOpen] =
    useState(false);
  const [isCreateCommonBillOpen, setIsCreateCommonBillOpen] =
    useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
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
    queryKey: ["treasurer", "bills", selectedCategoryFilter],
    queryFn: () =>
      getBills(
        selectedCategoryFilter !== "ALL"
          ? { billType: selectedCategoryFilter }
          : undefined,
      ),
  });

  const billingSummaryQuery = useQuery({
    queryKey: ["treasurer", "billing-summary"],
    queryFn: () => getBillingSummary(),
  });

  const invalidateTreasurerData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "bills"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "billing-summary"],
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

  const commonBillMutation = useMutation({
    mutationFn: (payload: CreateCommonBillPayload) =>
      createCommonBill(payload),
    onSuccess: async (res) => {
      toast.success(
        `Generated ${res.commonBill.title} for ${res.generatedCount} flat(s).`,
      );
      setIsCreateCommonBillOpen(false);
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
  const totalPages = Math.ceil(bills.length / ITEMS_PER_PAGE) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return bills.slice(start, start + ITEMS_PER_PAGE);
  }, [bills, currentPage]);
  const serverSummary = billingSummaryQuery.data;
  const billingStats = serverSummary
    ? {
        totalBills: serverSummary.totalBills,
        collected: serverSummary.totalCollected,
        outstanding: serverSummary.totalOutstanding,
        overdue: serverSummary.totalOverdue,
      }
    : bills.reduce(
        (stats, bill) => {
          stats.collected += bill.paidAmount;
          stats.outstanding += bill.balanceAmount;

          if (bill.status === "OVERDUE") {
            stats.overdue += bill.balanceAmount;
          }

          return stats;
        },
        {
          totalBills: bills.length,
          collected: 0,
          outstanding: 0,
          overdue: 0,
        },
      );
  const billingSummary = [
    {
      title: "Total Bills",
      value: (serverSummary?.totalBills ?? bills.length).toString(),
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
                Maintenance & Common Bills
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View individual resident bills, generate broadcast common bills, and track collection.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateBillOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-slate-500" />
                <span>Single Flat Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateCommonBillOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#07584F] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#064C44] cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>Create Common Bill</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            {BILL_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter(cat.value);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer shrink-0 ${
                  selectedCategoryFilter === cat.value
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat.label}
              </button>
            ))}
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
                No bills found for the selected category.
              </p>
            ) : (
              <>
                <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Bill Details</th>
                    <th className="pb-3 font-medium">Resident</th>
                    <th className="pb-3 font-medium">Unit / Flat</th>
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
                  {paginatedBills.map((bill) => {
                    const tagCfg =
                      BILL_TYPE_TAGS[bill.billType || "MONTHLY_MAINTENANCE"] ||
                      BILL_TYPE_TAGS.OTHER;

                    return (
                      <tr
                        key={bill._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4">
                          <div className="font-semibold text-slate-900">
                            {bill.title || tagCfg.label}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${tagCfg.className}`}
                            >
                              {tagCfg.label}
                            </span>
                            {bill.billingPeriod && (
                              <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {bill.billingPeriod}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-medium text-slate-900">
                          {bill.residentName || "Resident"}
                        </td>
                        <td className="py-4 text-slate-600">
                          {bill.unitName || (bill.flatNumber ? `Flat ${bill.flatNumber}` : "Unit")}
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
                    );
                  })}
                </tbody>
              </table>

              {/* Standard Project Pagination */}
              {bills.length > ITEMS_PER_PAGE ? (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <p>
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-800">
                      {Math.min(currentPage * ITEMS_PER_PAGE, bills.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {bills.length}
                    </span>{" "}
                    bills
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
          </div>
        </div>
      </div>

      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        onCreate={handleCreateBill}
      />

      <CreateCommonBillModal
        isOpen={isCreateCommonBillOpen}
        onClose={() => setIsCreateCommonBillOpen(false)}
        onCreate={async (payload) => {
          await commonBillMutation.mutateAsync(payload);
        }}
        isSubmitting={commonBillMutation.isPending}
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
                  {selectedBill.unitName ||
                    (selectedBill.flatNumber
                      ? `Flat ${selectedBill.flatNumber}`
                      : "Unit")}{" "}
                  • {selectedBill.residentName || "Resident"}
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
