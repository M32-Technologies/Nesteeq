"use client";

import { FormEvent, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CircleDollarSign,
  CreditCard,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  creditWallet,
  deductWallet,
  getWallets,
  type Wallet,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import AddAdvancePaymentModal, {
  NewAdvancePaymentData,
} from "./AddAdvancePaymentModal";

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the wallet request.";

export default function TreasurerWallet() {
  const queryClient = useQueryClient();
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] =
    useState(false);
  const [selectedWallet, setSelectedWallet] =
    useState<Wallet | null>(null);
  const [billId, setBillId] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionDescription, setDeductionDescription] =
    useState("Wallet deduction");
  const [deductionError, setDeductionError] =
    useState<string | null>(null);

  const walletsQuery = useQuery({
    queryKey: ["treasurer", "wallets"],
    queryFn: getWallets,
  });

  const invalidateWalletData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "wallets"],
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
      toast.success("Wallet credited.");
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
      toast.success("Wallet deduction applied.");
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
  const totalWalletBalance = wallets.reduce(
    (total, wallet) => total + wallet.balance,
    0,
  );
  const activeWallets = wallets.filter(
    (wallet) => wallet.balance > 0,
  ).length;
  const lowBalanceWallets = wallets.filter(
    (wallet) => wallet.balance <= 0,
  ).length;
  const totalCredits = wallets.reduce(
    (total, wallet) => total + wallet.totalAdded,
    0,
  );
  const walletSummary = [
    {
      title: "Total Wallet Balance",
      value: formatCurrency(totalWalletBalance),
      icon: WalletCards,
    },
    {
      title: "Active Wallets",
      value: activeWallets.toString(),
      icon: Users,
    },
    {
      title: "Total Credits",
      value: formatCurrency(totalCredits),
      icon: CircleDollarSign,
    },
    {
      title: "Zero Balance",
      value: lowBalanceWallets.toString(),
      icon: CreditCard,
    },
  ];

  const handleAddAdvancePayment = async (
    newPayment: NewAdvancePaymentData,
  ) => {
    await creditMutation.mutateAsync({
      ...newPayment,
    });
  };

  const openDeductionModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setBillId("");
    setDeductionAmount("");
    setDeductionDescription("Wallet deduction");
    setDeductionError(null);
  };

  const closeDeductionModal = () => {
    setSelectedWallet(null);
    setBillId("");
    setDeductionAmount("");
    setDeductionDescription("Wallet deduction");
    setDeductionError(null);
  };

  const handleDeduction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedWallet) {
      return;
    }

    const amount = Number(deductionAmount);

    if (!billId.match(/^[0-9a-fA-F]{24}$/)) {
      setDeductionError("Bill ID must be a valid MongoDB ObjectId.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setDeductionError("Amount must be greater than 0.");
      return;
    }

    if (amount > selectedWallet.balance) {
      setDeductionError("Amount exceeds wallet balance.");
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Resident Wallet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage resident advance balances and bill-linked wallet
            deductions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {walletSummary.map((item) => {
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
                Resident Wallets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track prepaid balances and transactions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdvanceModalOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Credit Wallet
            </button>
          </div>

          <div className="overflow-x-auto p-6">
            {walletsQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading wallets...
              </p>
            ) : walletsQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(walletsQuery.error)}
              </p>
            ) : wallets.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No resident wallets available.
              </p>
            ) : (
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Resident</th>
                    <th className="pb-3 font-medium">Balance</th>
                    <th className="pb-3 font-medium">Total Added</th>
                    <th className="pb-3 font-medium">Total Used</th>
                    <th className="pb-3 font-medium">Latest Transaction</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => {
                    const latestTransaction =
                      wallet.transactions.at(-1);

                    return (
                      <tr
                        key={wallet._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 font-medium text-slate-900">
                          {wallet.residentId}
                        </td>
                        <td className="py-4 font-semibold text-slate-900">
                          {formatCurrency(wallet.balance)}
                        </td>
                        <td className="py-4 text-slate-600">
                          {formatCurrency(wallet.totalAdded)}
                        </td>
                        <td className="py-4 text-slate-600">
                          {formatCurrency(wallet.totalUsed)}
                        </td>
                        <td className="py-4 text-slate-600">
                          {latestTransaction
                            ? `${latestTransaction.type} ${formatCurrency(
                                latestTransaction.amount,
                              )} on ${formatDate(
                                latestTransaction.createdAt,
                              )}`
                            : "No transactions"}
                        </td>
                        <td className="py-4">
                          <span
                            className={
                              wallet.balance > 0
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                            }
                          >
                            {wallet.balance > 0 ? "Active" : "Empty"}
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => openDeductionModal(wallet)}
                            disabled={wallet.balance <= 0}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Deduct Against Bill
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AddAdvancePaymentModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onAdd={handleAddAdvancePayment}
        isSubmitting={creditMutation.isPending}
      />

      {selectedWallet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Deduct Wallet Funds
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Link the deduction to an outstanding resident bill.
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
              <div className="space-y-5 p-6">
                {deductionError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {deductionError}
                  </p>
                ) : null}

                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Available balance:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(selectedWallet.balance)}
                  </span>
                </p>

                <label className="block text-sm font-medium text-slate-700">
                  Bill ID
                  <input
                    type="text"
                    value={billId}
                    onChange={(event) => setBillId(event.target.value)}
                    pattern="[0-9a-fA-F]{24}"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    max={selectedWallet.balance}
                    step="0.01"
                    value={deductionAmount}
                    onChange={(event) =>
                      setDeductionAmount(event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <input
                    type="text"
                    value={deductionDescription}
                    onChange={(event) =>
                      setDeductionDescription(event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDeductionModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deductMutation.isPending}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {deductMutation.isPending ? "Deducting..." : "Deduct"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
