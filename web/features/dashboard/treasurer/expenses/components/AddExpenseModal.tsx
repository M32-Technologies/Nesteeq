"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import type {
  CreateExpensePayload,
  ExpenseCategory,
} from "../../services/treasurer.service";

export type NewExpenseData = Omit<
  CreateExpensePayload,
  "apartmentId"
>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: NewExpenseData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const categories: Array<{
  value: ExpenseCategory;
  label: string;
}> = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "WATER", label: "Water" },
  { value: "SECURITY", label: "Security" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "REPAIR", label: "Repair" },
  { value: "SALARY", label: "Salary" },
  { value: "OTHER", label: "Other" },
];

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to add expense.";

export default function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setAmount("");
    setVendorName("");
    setExpenseDate("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (
      !title.trim() ||
      !category ||
      !expenseDate ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError("Title, category, amount and date are required.");
      return;
    }

    setError("");

    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        amount: parsedAmount,
        vendorName: vendorName.trim() || undefined,
        expenseDate,
      });

      resetForm();
      onClose();
    } catch (caughtError) {
      setError(getSafeErrorMessage(caughtError));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Expense
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Record a new apartment expense.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close add expense modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 sm:col-span-2">
                {error}
              </p>
            ) : null}

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Expense Name
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as ExpenseCategory | "",
                  )
                }
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Vendor
              <input
                type="text"
                value={vendorName}
                onChange={(event) =>
                  setVendorName(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                value={expenseDate}
                onChange={(event) =>
                  setExpenseDate(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Description
              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
