"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { getBillRecipients } from "../../services/treasurer.service";

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

  const recipientsQuery = useQuery({
    queryKey: ["treasurer", "bill-recipients"],
    queryFn: () => getBillRecipients(),
    enabled: isOpen,
  });

  const resetForm = () => {
    setResidentId("");
    setAmount("");
    setDescription("Advance payment");
    setError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const recipients = recipientsQuery.data ?? [];
  const activeResidents = recipients.filter(
    (r) => r.hasResident && Boolean(r.residentId)
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!residentId) {
      setError("Please select a resident.");
      return;
    }

    const parsedAmount = Number(amount);
    const trimmedDescription = description.trim();

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
        residentId,
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advance-payment-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="advance-payment-title" className="text-lg font-semibold text-slate-900">
              Credit Wallet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add resident advance balance for future bills.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
              Resident / Flat
              {recipientsQuery.isLoading ? (
                <div className="mt-2 text-xs text-slate-500">
                  Loading residents...
                </div>
              ) : activeResidents.length === 0 ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  No active residents found in this apartment. Please add or link residents to flats before crediting wallet.
                </div>
              ) : (
                <select
                  value={residentId}
                  onChange={(event) => setResidentId(event.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                >
                  <option value="">Select Resident / Flat</option>
                  {activeResidents.map((r) => (
                    <option key={r.residentId} value={r.residentId!}>
                      {r.flatNumber ? `Flat ${r.flatNumber}` : r.unitName} — {r.residentName} ({r.residentType || "resident"})
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="text-sm font-medium text-slate-700">
              Amount (₹)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                placeholder="e.g. 5000"
                onChange={(event) => setAmount(event.target.value)}
                required
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
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
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || activeResidents.length === 0}
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
