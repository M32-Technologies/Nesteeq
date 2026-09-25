"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  History,
  Search,
  Users,
  WalletCards,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  creditWallet,
  deductWallet,
  getBills,
  getWallets,
  getWalletSummary,
  type Wallet,
  type WalletTransaction,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import AddAdvancePaymentModal, {
  NewAdvancePaymentData,
} from "./AddAdvancePaymentModal";

const ITEMS_PER_PAGE = 8;

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the wallet request.";

export default function TreasurerWallet() {
  const queryClient = useQueryClient();

  // Modals state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [historyWallet, setHistoryWallet] = useState<Wallet | null>(null);

  // Deduction state
  const [billId, setBillId] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionDescription, setDeductionDescription] =
    useState("Wallet deduction for bill");
  const [deductionError, setDeductionError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ZERO">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const walletsQuery = useQuery({
    queryKey: ["treasurer", "wallets"],
    queryFn: getWallets,
  });

  const walletSummaryQuery = useQuery({
    queryKey: ["treasurer", "wallet-summary"],
    queryFn: getWalletSummary,
  });

  // Query unpaid bills for the selected wallet resident
  const residentBillsQuery = useQuery({
    queryKey: ["treasurer", "wallet-bills", selectedWallet?.residentId],
    queryFn: () => getBills({ residentId: selectedWallet!.residentId }),
    enabled: Boolean(selectedWallet?.residentId),
  });

  const unpaidBills = (residentBillsQuery.data ?? []).filter(
    (b) => b.balanceAmount > 0
  );
  const selectedBill = unpaidBills.find((b) => b._id === billId);

  const invalidateWalletData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "wallets"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "wallet-summary"],
      }),
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
  };

  const creditMutation = useMutation({
    mutationFn: creditWallet,
    onSuccess: async () => {
      toast.success("Wallet credited successfully.");
      setIsAdvanceModalOpen(false);
      await invalidateWalletData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const deductMutation = useMutation({
    mutationFn: deductWallet,
    onSuccess: async () => {
      toast.success("Wallet deduction applied and payment recorded.");
      closeDeductionModal();
      await invalidateWalletData();
    },
    onError: (error) => {
      const message = getSafeErrorMessage(error);
      setDeductionError(message);
      toast.error(message);
    },
  });

  const wallets = walletsQuery.data ?? [];
  const serverSummary = walletSummaryQuery.data;

  // Metrics Calculation from server summary with client fallback
  const totalWalletBalance =
    serverSummary?.totalBalance ??
    wallets.reduce((total, wallet) => total + wallet.balance, 0);

  const activeWallets =
    serverSummary?.activeWallets ??
    wallets.filter((wallet) => wallet.balance > 0).length;

  const zeroBalanceWallets =
    serverSummary?.zeroBalanceWallets ??
    wallets.filter((wallet) => wallet.balance <= 0).length;

  const totalCredits =
    serverSummary?.totalAdded ??
    wallets.reduce((total, wallet) => total + wallet.totalAdded, 0);

  const walletSummary = [
    {
      title: "Total Wallet Balance",
      value: formatCurrency(totalWalletBalance),
      icon: WalletCards,
      accent: "from-[#07584F] to-emerald-600",
    },
    {
      title: "Active Wallets",
      value: activeWallets.toString(),
      icon: Users,
      accent: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Credits",
      value: formatCurrency(totalCredits),
      icon: CircleDollarSign,
      accent: "from-purple-500 to-purple-600",
    },
    {
      title: "Zero Balance",
      value: zeroBalanceWallets.toString(),
      icon: CreditCard,
      accent: "from-slate-500 to-slate-600",
    },
  ];

  // Search & Status Filtering
  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      const term = search.toLowerCase().trim();
      const residentMatch = (wallet.residentName || "").toLowerCase().includes(term);
      const flatMatch = (wallet.flatNumber || "").toLowerCase().includes(term);
      const unitMatch = (wallet.unitName || "").toLowerCase().includes(term);
      const matchesSearch = !term || residentMatch || flatMatch || unitMatch;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && wallet.balance > 0) ||
        (statusFilter === "ZERO" && wallet.balance <= 0);

      return matchesSearch && matchesStatus;
    });
  }, [wallets, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWallets.length / ITEMS_PER_PAGE) || 1;
  const paginatedWallets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWallets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWallets, currentPage]);

  const handleAddAdvancePayment = async (
    newPayment: NewAdvancePaymentData
  ) => {
    await creditMutation.mutateAsync(newPayment);
  };

  const openDeductionModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setBillId("");
    setDeductionAmount("");
    setDeductionDescription("Wallet deduction for bill");
    setDeductionError(null);
  };

  const closeDeductionModal = () => {
    setSelectedWallet(null);
    setBillId("");
    setDeductionAmount("");
    setDeductionDescription("Wallet deduction for bill");
    setDeductionError(null);
  };

  const handleBillSelect = (selectedId: string) => {
    setBillId(selectedId);
    setDeductionError(null);
    const bill = unpaidBills.find((b) => b._id === selectedId);
    if (bill && selectedWallet) {
      const suggestedAmount = Math.min(selectedWallet.balance, bill.balanceAmount);
      setDeductionAmount(suggestedAmount > 0 ? suggestedAmount.toString() : "");
    }
  };

  const handleDeduction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedWallet) {
      return;
    }

    if (!billId) {
      setDeductionError("Please select an outstanding bill to deduct against.");
      return;
    }

    const amount = Number(deductionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setDeductionError("Amount must be greater than 0.");
      return;
    }

    if (amount > selectedWallet.balance) {
      setDeductionError("Deduction amount exceeds available wallet balance.");
      return;
    }

    if (selectedBill && amount > selectedBill.balanceAmount) {
      setDeductionError("Deduction amount exceeds the remaining bill balance.");
      return;
    }

    if (!deductionDescription.trim()) {
      setDeductionError("Description is required.");
      return;
    }

    setDeductionError(null);
    deductMutation.mutate({
      residentId: selectedWallet.residentId,
      billId,
      amount,
      description: deductionDescription.trim(),
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resident Wallet
            </h1>
            <p className="text-sm text-slate-500">
              Manage resident advance balances and bill-linked wallet deductions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAdvanceModalOpen(true)}
            className="self-start rounded-lg bg-[#07584F] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#064e46]"
          >
            Credit Wallet
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {walletSummary.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wallets Table Container */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search resident or flat..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["ALL", "ACTIVE", "ZERO"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter);
                      setCurrentPage(1);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      statusFilter === filter
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {filter === "ALL"
                      ? "All"
                      : filter === "ACTIVE"
                      ? "Active"
                      : "Zero"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto p-5 sm:p-6">
            {walletsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading resident wallets...
              </p>
            ) : walletsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(walletsQuery.error)}
              </p>
            ) : filteredWallets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No resident wallets found
                </p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search keyword or filters.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Resident</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Total Added</th>
                    <th className="pb-3">Total Used</th>
                    <th className="pb-3">Latest Transaction</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedWallets.map((wallet) => {
                    const latestTransaction = wallet.transactions.at(-1);

                    return (
                      <tr
                        key={wallet._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="py-3.5 font-medium text-slate-900">
                          <span className="block font-semibold text-slate-900">
                            {wallet.residentName || "Resident"}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {wallet.flatNumber
                              ? `Flat ${wallet.flatNumber}`
                              : wallet.unitName || "No flat assigned"}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          <span
                            className={
                              wallet.balance > 0
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }
                          >
                            {formatCurrency(wallet.balance)}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {formatCurrency(wallet.totalAdded)}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {formatCurrency(wallet.totalUsed)}
                        </td>
                        <td className="py-3.5 text-xs text-slate-600">
                          {latestTransaction ? (
                            <div className="space-y-0.5">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  latestTransaction.type === "CREDIT"
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {latestTransaction.type === "CREDIT" ? "+" : "-"}
                                {formatCurrency(latestTransaction.amount)}
                              </span>
                              <span className="block text-[11px] text-slate-400">
                                {formatDate(latestTransaction.createdAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">No transactions</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={
                              wallet.balance > 0
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                                : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                            }
                          >
                            {wallet.balance > 0 ? "Active" : "Empty"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setHistoryWallet(wallet)}
                              title="View Transaction History"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <History className="h-3.5 w-3.5 text-slate-500" />
                              History
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeductionModal(wallet)}
                              disabled={wallet.balance <= 0}
                              className="rounded-lg bg-[#07584F] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#064e46] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              Deduct
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {filteredWallets.length > ITEMS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredWallets.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredWallets.length}
                  </span>{" "}
                  wallets
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
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

      {/* Credit Wallet Modal */}
      <AddAdvancePaymentModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onAdd={handleAddAdvancePayment}
        isSubmitting={creditMutation.isPending}
      />

      {/* Deduct Wallet Modal */}
      {selectedWallet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Deduct Wallet Funds
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Resident:{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedWallet.residentName || "Resident"}
                  </span>{" "}
                  {selectedWallet.flatNumber ? `(Flat ${selectedWallet.flatNumber})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeductionModal}
                aria-label="Close wallet deduction modal"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDeduction}>
              <div className="space-y-4 p-6">
                {deductionError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                    {deductionError}
                  </p>
                ) : null}

                {/* Available Wallet Balance Box */}
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div>
                    <span className="text-xs font-medium text-emerald-800">
                      Available Wallet Balance
                    </span>
                    <p className="text-lg font-bold text-emerald-950">
                      {formatCurrency(selectedWallet.balance)}
                    </p>
                  </div>
                  <WalletCards className="h-6 w-6 text-emerald-600" />
                </div>

                {/* Outstanding Bill Dropdown */}
                <label className="block text-xs font-semibold text-slate-700">
                  Select Outstanding Bill
                  {residentBillsQuery.isLoading ? (
                    <div className="mt-2 text-xs text-slate-500">
                      Loading resident bills...
                    </div>
                  ) : unpaidBills.length === 0 ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      This resident has no outstanding or partially paid bills to deduct against.
                    </div>
                  ) : (
                    <select
                      value={billId}
                      onChange={(event) => handleBillSelect(event.target.value)}
                      required
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Select a pending bill</option>
                      {unpaidBills.map((b) => (
                        <option key={b._id} value={b._id}>
                          Bill #{b._id.slice(-6).toUpperCase()} — Due: {formatDate(b.dueDate)} | Balance: {formatCurrency(b.balanceAmount)}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                {/* Itemized Bill Breakdown */}
                {selectedBill ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Bill Amount:</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(selectedBill.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Already Paid:</span>
                      <span className="font-medium text-emerald-700">
                        {formatCurrency(selectedBill.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="font-medium text-slate-700">Remaining Balance:</span>
                      <span className="font-bold text-rose-600">
                        {formatCurrency(selectedBill.balanceAmount)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Amount to Deduct */}
                <label className="block text-xs font-semibold text-slate-700">
                  Deduction Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    max={Math.min(
                      selectedWallet.balance,
                      selectedBill?.balanceAmount ?? selectedWallet.balance
                    )}
                    step="0.01"
                    value={deductionAmount}
                    onChange={(event) =>
                      setDeductionAmount(event.target.value)
                    }
                    placeholder="e.g. 1500"
                    required
                    disabled={!billId}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Max: {formatCurrency(Math.min(selectedWallet.balance, selectedBill?.balanceAmount ?? selectedWallet.balance))}
                  </span>
                </label>

                {/* Description */}
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                  <input
                    type="text"
                    value={deductionDescription}
                    onChange={(event) =>
                      setDeductionDescription(event.target.value)
                    }
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDeductionModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deductMutation.isPending || !billId}
                  className="rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#064e46] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {deductMutation.isPending ? "Deducting..." : "Confirm Deduction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Transaction History Modal */}
      {historyWallet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  {historyWallet.residentName || "Resident"}&apos;s Wallet History
                </h3>
                <p className="text-xs text-slate-500">
                  {historyWallet.flatNumber ? `Flat ${historyWallet.flatNumber}` : "Resident Wallet"} • Current Balance:{" "}
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(historyWallet.balance)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryWallet(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overview stats in modal */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Balance</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(historyWallet.balance)}</span>
              </div>
              <div className="rounded-lg bg-emerald-50/50 p-2.5 text-center border border-emerald-100">
                <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Total Added</span>
                <span className="text-sm font-bold text-emerald-900">{formatCurrency(historyWallet.totalAdded)}</span>
              </div>
              <div className="rounded-lg bg-amber-50/50 p-2.5 text-center border border-amber-100">
                <span className="text-[10px] uppercase font-semibold text-amber-600 block">Total Used</span>
                <span className="text-sm font-bold text-amber-900">{formatCurrency(historyWallet.totalUsed)}</span>
              </div>
            </div>

            {/* Ledger Transactions */}
            <div className="mt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Transaction Ledger ({historyWallet.transactions.length})
              </h4>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
                {historyWallet.transactions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No transactions recorded for this wallet yet.
                  </div>
                ) : (
                  historyWallet.transactions
                    .slice()
                    .reverse()
                    .map((tx: WalletTransaction, idx: number) => {
                      const isCredit = tx.type === "CREDIT";

                      return (
                        <div
                          key={tx._id || idx}
                          className="flex items-center justify-between p-3 transition hover:bg-slate-50/50 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                isCredit
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {isCredit ? "Advance Credit" : "Bill Deduction"}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>{formatDate(tx.createdAt)}</span>
                                {tx.billId ? (
                                  <span className="font-mono text-slate-500">
                                    • Bill #{tx.billId.slice(-6).toUpperCase()}
                                  </span>
                                ) : null}
                              </div>
                              {tx.description ? (
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {tx.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <span
                            className={`font-bold ${
                              isCredit ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryWallet(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
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
