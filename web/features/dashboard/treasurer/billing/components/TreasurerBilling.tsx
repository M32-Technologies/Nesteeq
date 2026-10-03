"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Receipt,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBill,
  createCommonBill,
  deleteBill,
  getBills,
  getBillingSummary,
  getCommonBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
  type Bill,
  type CommonBill,
  type CreateBillPayload,
  type CreateCommonBillPayload,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import CreateBillModal from "./CreateBillModal";
import CreateCommonBillModal from "./CreateCommonBillModal";
import PaymentReceiptModal from "./PaymentReceiptModal";

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
  LIFT_MAINTENANCE: {
    label: "Lift AMC",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
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
  { value: "LIFT_MAINTENANCE", label: "Lift Maintenance" },
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
  if (!date) return "";
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TreasurerBilling() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [activeMainTab, setActiveMainTab] = useState<"BILLS" | "CAMPAIGNS">("BILLS");
  const [isCreateBillOpen, setIsCreateBillOpen] =
    useState(false);
  const [isCreateCommonBillOpen, setIsCreateCommonBillOpen] =
    useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(
    null,
  );
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const [action, setAction] = useState<BillAction | null>(null);
  const [amount, setAmount] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [waiverReason, setWaiverReason] = useState("");
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

  const commonBillsQuery = useQuery({
    queryKey: ["treasurer", "common-bills"],
    queryFn: () => getCommonBills(),
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
        queryKey: ["treasurer", "common-bills"],
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

  const deleteMutation = useMutation({
    mutationFn: ({
      billId,
      reason,
    }: {
      billId: string;
      reason?: string;
    }) => deleteBill(billId, reason),
    onSuccess: async () => {
      toast.success("Bill cancelled and deleted successfully.");
      setIsDeleteModalOpen(false);
      setBillToDelete(null);
      setDeleteReason("");
      await invalidateTreasurerData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

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
      options,
    }: {
      billId: string;
      paymentAmount: number;
      options?: {
        paymentMethod?: string;
        referenceNo?: string;
        description?: string;
      };
    }) => recordBillPayment(billId, paymentAmount, options),
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
      reason,
    }: {
      billId: string;
      waiverAmount: number;
      reason?: string;
    }) => waiveLateFee(billId, waiverAmount, reason),
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
    setPaymentMethod("CASH");
    setReferenceNo("");
    setPaymentDescription("");
    setWaiverReason("");
  };

  const closeActionModal = () => {
    setSelectedBill(null);
    setAction(null);
    setAmount("");
    setActionError(null);
    setBaseAmount("");
    setDueDate("");
    setLateFeePerDay("");
    setPaymentMethod("CASH");
    setReferenceNo("");
    setPaymentDescription("");
    setWaiverReason("");
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
          options: {
            paymentMethod,
            referenceNo: referenceNo.trim() || undefined,
            description: paymentDescription.trim() || undefined,
          },
        });
      } else {
        waiverMutation.mutate({
          billId: selectedBill._id,
          waiverAmount: parsedAmount,
          reason: waiverReason.trim() || undefined,
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

    const additionalTotal = (selectedBill.additionalCharges || []).reduce(
      (sum, charge) => sum + (charge.amount || 0),
      0
    );

    if (parsedBaseAmount + additionalTotal < selectedBill.paidAmount) {
      setActionError(
        `Base amount cannot make the total bill amount less than the amount already paid (${formatCurrency(selectedBill.paidAmount)}).`,
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
  const filteredBills = useMemo(() => {
    let result = bills;

    if (selectedStatusFilter !== "ALL") {
      result = result.filter((b) => b.status === selectedStatusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((b) => {
        const flat = (b.unitName || b.flatNumber || "").toLowerCase();
        const resident = (b.residentName || "").toLowerCase();
        const title = (b.title || "").toLowerCase();
        const period = (b.billingPeriod || "").toLowerCase();
        return (
          flat.includes(q) ||
          resident.includes(q) ||
          title.includes(q) ||
          period.includes(q)
        );
      });
    }

    return result;
  }, [bills, selectedStatusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBills = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredBills.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBills, validCurrentPage]);

  const CAMPAIGNS_PER_PAGE = 6;
  const rawCampaigns = commonBillsQuery.data ?? [];
  const totalCampaignPages = Math.ceil(rawCampaigns.length / CAMPAIGNS_PER_PAGE) || 1;
  const safeCampaignPage = Math.min(Math.max(1, campaignsPage), totalCampaignPages);

  useEffect(() => {
    if (campaignsPage > totalCampaignPages) {
      setCampaignsPage(totalCampaignPages);
    }
  }, [campaignsPage, totalCampaignPages]);

  const paginatedCampaigns = useMemo(() => {
    const start = (safeCampaignPage - 1) * CAMPAIGNS_PER_PAGE;
    return rawCampaigns.slice(start, start + CAMPAIGNS_PER_PAGE);
  }, [rawCampaigns, safeCampaignPage]);
  const serverSummary = billingSummaryQuery.data;
  const billingStats = useMemo(() => {
    if (selectedCategoryFilter === "ALL" && serverSummary) {
      return {
        totalBills: serverSummary.totalBills,
        collected: serverSummary.totalCollected,
        outstanding: serverSummary.totalOutstanding,
        overdue: serverSummary.totalOverdue,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills.reduce(
      (stats, bill) => {
        stats.collected += bill.paidAmount;
        stats.outstanding += bill.balanceAmount;

        const isOverdue =
          bill.status === "OVERDUE" ||
          (bill.balanceAmount > 0 && new Date(bill.dueDate) < today);

        if (isOverdue) {
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
  }, [selectedCategoryFilter, serverSummary, bills]);
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

          {/* Main View Switcher: Individual Bills vs Common Bill Campaigns */}
          <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 bg-slate-50/20">
            <button
              type="button"
              onClick={() => setActiveMainTab("BILLS")}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                activeMainTab === "BILLS"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Individual Flat Bills</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold">
                {bills.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("CAMPAIGNS")}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                activeMainTab === "CAMPAIGNS"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Common Bill Campaigns</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700 font-bold border border-indigo-100">
                {commonBillsQuery.data?.length ?? 0}
              </span>
            </button>
          </div>

          {activeMainTab === "CAMPAIGNS" ? (
            <div className="p-6">
              {commonBillsQuery.isLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading common bill campaigns...
                </div>
              ) : !commonBillsQuery.data || commonBillsQuery.data.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No Common Bill Campaigns Yet</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Common bills allow broadcasting recurring maintenance, lift AMC, water, or repair charges across all flats or selected blocks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateCommonBillOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create First Common Bill
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedCampaigns.map((campaign) => {
                      const tagCfg =
                        BILL_TYPE_TAGS[campaign.billType] || BILL_TYPE_TAGS.OTHER;
                      const stats = campaign.stats || {
                        paidCount: 0,
                        pendingCount: 0,
                        overdueCount: 0,
                        collectedAmount: 0,
                        outstandingAmount: 0,
                      };
                      const totalFlats = campaign.totalFlatsCount || (stats.paidCount + stats.pendingCount + stats.overdueCount) || 1;
                      const paidPercent = Math.min(100, Math.round((stats.paidCount / totalFlats) * 100));
                      const overduePercent = Math.min(100 - paidPercent, Math.round((stats.overdueCount / totalFlats) * 100));

                      return (
                        <div
                          key={campaign._id}
                          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${tagCfg.className}`}>
                                {tagCfg.label}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Due: {formatDate(campaign.dueDate)}
                              </span>
                            </div>

                            <h3 className="mt-2 text-sm font-bold text-slate-900 line-clamp-1">
                              {campaign.title}
                            </h3>
                            {campaign.billingPeriod && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Period: <span className="font-mono">{campaign.billingPeriod}</span>
                              </p>
                            )}

                            {/* Financial Summary */}
                            <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                              <div>
                                <span className="text-[10px] font-medium text-slate-400 uppercase">Target</span>
                                <p className="text-xs font-bold text-slate-900 mt-0.5">
                                  {formatCurrency(campaign.totalAmount)}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-medium text-emerald-600 uppercase">Collected</span>
                                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                  {formatCurrency(stats.collectedAmount)}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-medium text-rose-500 uppercase">Pending</span>
                                <p className="text-xs font-bold text-rose-600 mt-0.5">
                                  {formatCurrency(stats.outstandingAmount)}
                                </p>
                              </div>
                            </div>

                            {/* Flats Progress Bar */}
                            <div className="mt-3.5">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="text-slate-600 font-medium">
                                  Flats: <span className="font-bold text-emerald-700">{stats.paidCount}</span> / {totalFlats} Paid
                                </span>
                                <span className="text-slate-500 font-medium">
                                  {paidPercent}%
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
                                <div
                                  style={{ width: `${paidPercent}%` }}
                                  className="bg-emerald-500 transition-all duration-300"
                                  title={`${stats.paidCount} Paid`}
                                />
                                <div
                                  style={{ width: `${overduePercent}%` }}
                                  className="bg-rose-500 transition-all duration-300"
                                  title={`${stats.overdueCount} Overdue`}
                                />
                              </div>
                              {stats.overdueCount > 0 && (
                                <p className="text-[10px] text-rose-600 font-medium mt-1">
                                  {stats.overdueCount} flat(s) overdue
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 capitalize">
                              Target: <span className="font-semibold text-slate-700">{campaign.targetType.replace(/_/g, " ").toLowerCase()}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm(campaign.title);
                                setCurrentPage(1);
                                setActiveMainTab("BILLS");
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                            >
                              <span>View Flats</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {rawCampaigns.length > 0 && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                      <p className="font-medium">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                          {(safeCampaignPage - 1) * CAMPAIGNS_PER_PAGE + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-slate-800">
                          {Math.min(safeCampaignPage * CAMPAIGNS_PER_PAGE, rawCampaigns.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800">
                          {rawCampaigns.length}
                        </span>{" "}
                        campaigns
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={safeCampaignPage <= 1}
                          onClick={() => setCampaignsPage((p) => Math.max(1, p - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#07584F] px-2.5 text-xs font-semibold text-white shadow-2xs">
                          {safeCampaignPage}
                        </span>
                        <button
                          type="button"
                          disabled={safeCampaignPage >= totalCampaignPages}
                          onClick={() => setCampaignsPage((p) => Math.min(totalCampaignPages, p + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
          {/* Search, Status & Category Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search flat, resident, title..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 shrink-0">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PAID">Paid</option>
              </select>
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
            ) : filteredBills.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No bills found matching your search or filters.
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
                                bill.status === "PAID" ||
                                bill.balanceAmount <= 0 ||
                                bill.lateFeeAmount - bill.lateFeeWaivedAmount <=
                                0
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Waive
                            </button>
                            {bill.paidAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptBill(bill);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                title="View & Print Official Receipt"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                Receipt
                              </button>
                            )}
                            {bill.paidAmount === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBillToDelete(bill);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                                title="Cancel and Delete Unpaid Bill"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Standard Project Pagination */}
              {filteredBills.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                  <p className="font-medium">
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                      {(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-800">
                      {Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredBills.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {filteredBills.length}
                    </span>{" "}
                    bills
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={validCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#07584F] px-2.5 text-xs font-semibold text-white shadow-2xs">
                      {validCurrentPage}
                    </span>
                    <button
                      type="button"
                      disabled={validCurrentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </>
      )}
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
                ) : action === "payment" ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Payment Amount (₹)
                      <input
                        type="number"
                        min="0.01"
                        max={selectedBill.balanceAmount}
                        step="0.01"
                        value={amount}
                        onChange={(event) =>
                          setAmount(event.target.value)
                        }
                        required
                        placeholder={`Balance: ₹${selectedBill.balanceAmount}`}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Payment Method
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 cursor-pointer"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / RTGS)</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Reference / Cheque / UTR No (Optional)
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="e.g. UTR-8729104 or Cheque #000214"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Payment Notes (Optional)
                      <input
                        type="text"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        placeholder="e.g. Received at society office"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Waiver Amount (₹)
                      <input
                        type="number"
                        min="0.01"
                        max={Math.max(
                          0,
                          selectedBill.lateFeeAmount -
                            selectedBill.lateFeeWaivedAmount,
                        )}
                        step="0.01"
                        value={amount}
                        onChange={(event) =>
                          setAmount(event.target.value)
                        }
                        required
                        placeholder={`Max waiver: ₹${Math.max(0, selectedBill.lateFeeAmount - selectedBill.lateFeeWaivedAmount)}`}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Reason for Waiver (Audit Note)
                      <input
                        type="text"
                        value={waiverReason}
                        onChange={(e) => setWaiverReason(e.target.value)}
                        placeholder="e.g. Approved by Management Committee / First-time delay"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                      />
                    </label>
                  </div>
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

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptBill(null);
        }}
        bill={receiptBill}
      />

      {/* Delete / Cancel Bill Confirmation Modal */}
      {isDeleteModalOpen && billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancel & Delete Bill
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove this unpaid invoice.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-700 space-y-1.5">
              <p>
                <span className="font-semibold text-slate-500">Unit:</span>{" "}
                <span className="font-bold text-slate-900">
                  {billToDelete.unitName || `Flat ${billToDelete.flatNumber}`}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Resident:</span>{" "}
                {billToDelete.residentName}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Amount:</span>{" "}
                <span className="font-bold text-slate-900">
                  {formatCurrency(billToDelete.totalAmount)}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Title:</span>{" "}
                {billToDelete.title || billToDelete.billType}
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Created by mistake / duplicate"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setBillToDelete(null);
                  setDeleteReason("");
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Keep Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate({
                    billId: billToDelete._id,
                    reason: deleteReason.trim() || undefined,
                  });
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300 transition"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
