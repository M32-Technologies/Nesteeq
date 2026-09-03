"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

export interface NewAdvancePaymentData {
  residentId: string;
  amount: number;
  description: string;
}

interface AddAdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payment: NewAdvancePaymentData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to credit wallet.";

export default function AddAdvancePaymentModal({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}: AddAdvancePaymentModalProps) {
  const [residentId, setResidentId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Advance payment");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setResidentId("");
    setAmount("");
    setDescription("Advance payment");
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

    const trimmedResidentId = residentId.trim();
    const parsedAmount = Number(amount);
    const trimmedDescription = description.trim();

    if (!objectIdPattern.test(trimmedResidentId)) {
      setError("Resident ID must be a valid MongoDB ObjectId.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (!trimmedDescription) {
      setError("Description is required.");
      return;
    }

    setError("");

    try {
      await onAdd({
        residentId: trimmedResidentId,
        amount: parsedAmount,
        description: trimmedDescription,
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
              Credit Wallet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add resident advance balance for future bills.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <label className="text-sm font-medium text-slate-700">
              Resident ID
              <input
                type="text"
                value={residentId}
                onChange={(event) => setResidentId(event.target.value)}
                pattern="[0-9a-fA-F]{24}"
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
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
              Description
              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                required
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
              {isSubmitting ? "Crediting..." : "Credit Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
