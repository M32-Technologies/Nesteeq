"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CircleDollarSign,
  Clock3,
  FileText,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  createExpense,
  getExpenses,
  updateExpense,
  type Expense,
  type ExpenseStatus,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/format";
import AddExpenseModal, {
  NewExpenseData,
} from "./AddExpenseModal";

const statusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
};

const statusClassNames: Record<ExpenseStatus, string> = {
  PENDING:
    "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700",
  APPROVED:
    "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700",
  REJECTED:
    "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700",
  PAID:
    "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700",
};

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the expense request.";

export default function TreasurerExpenses() {
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] =
    useState(false);

  const expensesQuery = useQuery({
    queryKey: ["treasurer", "expenses"],
    queryFn: () => getExpenses(),
  });

  const invalidateExpenseData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["treasurer", "expenses"],
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

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      toast.success("Expense created.");
      setIsAddExpenseOpen(false);
      await invalidateExpenseData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      expenseId,
      status,
    }: {
      expenseId: string;
      status: ExpenseStatus;
    }) => updateExpense(expenseId, { status }),
    onSuccess: async () => {
      toast.success("Expense updated.");
      await invalidateExpenseData();
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error));
    },
  });

  const handleAddExpense = async (
    newExpense: NewExpenseData,
  ) => {
    await createMutation.mutateAsync(newExpense);
  };

  const expenses = expensesQuery.data ?? [];
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const approvedExpenses = expenses
    .filter(
      (expense) =>
        expense.status === "APPROVED" ||
        expense.status === "PAID",
    )
    .reduce((total, expense) => total + expense.amount, 0);
  const pendingExpenses = expenses
    .filter((expense) => expense.status === "PENDING")
    .reduce((total, expense) => total + expense.amount, 0);
  const pendingCount = expenses.filter(
    (expense) => expense.status === "PENDING",
  ).length;
  const expenseSummary = [
    {
      title: "Total Expenses",
      value: formatCurrency(totalExpenses),
      icon: WalletCards,
    },
    {
      title: "Approved Expenses",
      value: formatCurrency(approvedExpenses),
      icon: CircleDollarSign,
    },
    {
      title: "Pending Amount",
      value: formatCurrency(pendingExpenses),
      icon: Clock3,
    },
    {
      title: "Pending Requests",
      value: pendingCount.toString(),
      icon: FileText,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage apartment expenses and expense approval records.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expenseSummary.map((item) => {
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
                Expense Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage apartment expenses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add Expense
            </button>
          </div>

          <div className="overflow-x-auto p-6">
            {expensesQuery.isLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading expenses...
              </p>
            ) : expensesQuery.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getSafeErrorMessage(expensesQuery.error)}
              </p>
            ) : expenses.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No expenses recorded.
              </p>
            ) : (
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Expense</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense: Expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {expense.title}
                      </td>
                      <td className="py-4 text-slate-600">
                        {expense.category}
                      </td>
                      <td className="py-4 text-slate-600">
                        {expense.vendorName || "Not recorded"}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td className="py-4">
                        <span
                          className={statusClassNames[expense.status]}
                        >
                          {statusLabels[expense.status]}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {expense.status === "PENDING" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  statusMutation.mutate({
                                    expenseId: expense._id,
                                    status: "APPROVED",
                                  })
                                }
                                disabled={statusMutation.isPending}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  statusMutation.mutate({
                                    expenseId: expense._id,
                                    status: "REJECTED",
                                  })
                                }
                                disabled={statusMutation.isPending}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          {expense.status === "APPROVED" ? (
                            <button
                              type="button"
                              onClick={() =>
                                statusMutation.mutate({
                                  expenseId: expense._id,
                                  status: "PAID",
                                })
                              }
                              disabled={statusMutation.isPending}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Mark Paid
                            </button>
                          ) : null}
                          {expense.status === "PAID" ||
                          expense.status === "REJECTED" ? (
                            <span className="text-xs font-medium text-slate-400">
                              Final
                            </span>
                          ) : null}
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

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={handleAddExpense}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
