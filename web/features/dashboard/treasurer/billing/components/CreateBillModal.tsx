"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import type { CreateBillPayload } from "../types/billing.types";

export type NewBillData = CreateBillPayload;

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bill: CreateBillPayload) => void | Promise<void>;
}

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const getSafeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create bill.";
};

export default function CreateBillModal({
  isOpen,
  onClose,
  onCreate,
}: CreateBillModalProps) {
  const [residentId, setResidentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("0");
  const [additionalChargeTitle, setAdditionalChargeTitle] =
    useState("");
  const [additionalChargeAmount, setAdditionalChargeAmount] =
    useState("");
  const [additionalChargeReason, setAdditionalChargeReason] =
    useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setResidentId("");
    setUnitId("");
    setBaseAmount("");
    setDueDate("");
    setLateFeePerDay("0");
    setAdditionalChargeTitle("");
    setAdditionalChargeAmount("");
    setAdditionalChargeReason("");
    setError("");
    setIsSubmitting(false);
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
    const trimmedUnitId = unitId.trim();
    const trimmedChargeTitle = additionalChargeTitle.trim();
    const trimmedChargeReason = additionalChargeReason.trim();
    const parsedBaseAmount = Number(baseAmount);
    const parsedLateFeePerDay = Number(lateFeePerDay || "0");
    const parsedChargeAmount = Number(
      additionalChargeAmount || "0",
    );

    if (!trimmedResidentId || !trimmedUnitId || !dueDate) {
      setError("Resident ID, Unit ID and Due Date are required.");
      return;
    }

    if (!objectIdPattern.test(trimmedResidentId)) {
      setError("Resident ID must be a valid MongoDB ObjectId.");
      return;
    }

    if (!objectIdPattern.test(trimmedUnitId)) {
      setError("Unit ID must be a valid MongoDB ObjectId.");
      return;
    }

    if (
      !Number.isFinite(parsedBaseAmount) ||
      parsedBaseAmount <= 0
    ) {
      setError("Base Amount must be greater than 0.");
      return;
    }

    if (
      !Number.isFinite(parsedLateFeePerDay) ||
      parsedLateFeePerDay < 0
    ) {
      setError("Late Fee Per Day must be 0 or greater.");
      return;
    }

    if (
      additionalChargeAmount &&
      (!Number.isFinite(parsedChargeAmount) ||
        parsedChargeAmount < 0)
    ) {
      setError("Additional charge amount must be 0 or greater.");
      return;
    }

    const payload: CreateBillPayload = {
      residentId: trimmedResidentId,
      unitId: trimmedUnitId,
      baseAmount: parsedBaseAmount,
      dueDate,
      lateFeePerDay: parsedLateFeePerDay,
    };

    if (trimmedChargeTitle) {
      payload.additionalCharges = [
        {
          title: trimmedChargeTitle,
          amount: parsedChargeAmount,
          ...(trimmedChargeReason
            ? {
                reason: trimmedChargeReason,
              }
            : {}),
        },
      ];
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onCreate(payload);

      resetForm();
      onClose();
    } catch (caughtError) {
      setError(getSafeErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Create Bill
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a maintenance bill for a resident account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close create bill modal"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
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

            <div>
              <label
                htmlFor="residentId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Resident ID
              </label>

              <input
                id="residentId"
                type="text"
                value={residentId}
                onChange={(event) =>
                  setResidentId(event.target.value)
                }
                placeholder="24-character resident ObjectId"
                pattern="[0-9a-fA-F]{24}"
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="unitId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Unit ID
              </label>

              <input
                id="unitId"
                type="text"
                value={unitId}
                onChange={(event) => setUnitId(event.target.value)}
                placeholder="24-character unit ObjectId"
                pattern="[0-9a-fA-F]{24}"
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="baseAmount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Base Amount
              </label>

              <input
                id="baseAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={baseAmount}
                onChange={(event) =>
                  setBaseAmount(event.target.value)
                }
                placeholder="2500"
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Due Date
              </label>

              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="lateFeePerDay"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Late Fee Per Day
              </label>

              <input
                id="lateFeePerDay"
                type="number"
                min="0"
                step="0.01"
                value={lateFeePerDay}
                onChange={(event) =>
                  setLateFeePerDay(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="border-t border-slate-200 pt-5 sm:col-span-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Additional Charge
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Leave the title empty to skip this optional charge.
              </p>
            </div>

            <div>
              <label
                htmlFor="additionalChargeTitle"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Charge Title
              </label>

              <input
                id="additionalChargeTitle"
                type="text"
                value={additionalChargeTitle}
                onChange={(event) =>
                  setAdditionalChargeTitle(event.target.value)
                }
                placeholder="Parking fee"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="additionalChargeAmount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Charge Amount
              </label>

              <input
                id="additionalChargeAmount"
                type="number"
                min="0"
                step="0.01"
                value={additionalChargeAmount}
                onChange={(event) =>
                  setAdditionalChargeAmount(event.target.value)
                }
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="additionalChargeReason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Charge Reason
              </label>

              <input
                id="additionalChargeReason"
                type="text"
                value={additionalChargeReason}
                onChange={(event) =>
                  setAdditionalChargeReason(event.target.value)
                }
                placeholder="Optional reason"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>
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
              {isSubmitting ? "Creating..." : "Create Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
