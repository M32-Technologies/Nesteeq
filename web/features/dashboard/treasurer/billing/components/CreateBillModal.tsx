"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";

import { getBillRecipients } from "../services/billing.service";
import type {
  BillRecipient,
  CreateBillPayload,
} from "../types/billing.types";

export type NewBillData = CreateBillPayload;

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bill: CreateBillPayload) => void | Promise<void>;
}

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
  const [residentName, setResidentName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [billType, setBillType] = useState("MONTHLY_MAINTENANCE");
  const [title, setTitle] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("0");
  const [additionalCharges, setAdditionalCharges] = useState<
    { title: string; amount: string; reason: string }[]
  >([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAdditionalCharge = () => {
    setAdditionalCharges((prev) => [
      ...prev,
      { title: "", amount: "", reason: "" },
    ]);
  };

  const updateAdditionalCharge = (
    index: number,
    field: "title" | "amount" | "reason",
    value: string
  ) => {
    setAdditionalCharges((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges((prev) => prev.filter((_, i) => i !== index));
  };

  const recipientsQuery = useQuery<BillRecipient[]>({
    queryKey: ["bill-recipients"],
    queryFn: () => getBillRecipients(),
    enabled: isOpen,
  });

  const recipients = recipientsQuery.data ?? [];
  const selectedRecipient = recipients.find((r) => r.unitId === unitId);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setResidentId("");
    setResidentName("");
    setUnitId("");
    setBillType("MONTHLY_MAINTENANCE");
    setTitle("");
    setBillingPeriod("");
    setDescription("");
    setBaseAmount("");
    setDueDate("");
    setLateFeePerDay("0");
    setAdditionalCharges([]);
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

    const trimmedUnitId = unitId.trim();
    const parsedBaseAmount = Number(baseAmount);
    const parsedLateFeePerDay = Number(lateFeePerDay || "0");

    if (!trimmedUnitId) {
      setError("Please select a Unit / Flat.");
      return;
    }

    if (!dueDate) {
      setError("Due Date is required.");
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

    const validAdditionalCharges: { title: string; amount: number; reason?: string }[] = [];
    for (const [idx, charge] of additionalCharges.entries()) {
      const chargeTitle = charge.title.trim();
      const chargeAmount = Number(charge.amount);
      if (!chargeTitle && !charge.amount) continue;
      if (!chargeTitle) {
        setError(`Additional charge #${idx + 1} needs a title.`);
        return;
      }
      if (!Number.isFinite(chargeAmount) || chargeAmount < 0) {
        setError(`Additional charge "${chargeTitle}" amount must be 0 or greater.`);
        return;
      }
      validAdditionalCharges.push({
        title: chargeTitle,
        amount: chargeAmount,
        ...(charge.reason.trim() ? { reason: charge.reason.trim() } : {}),
      });
    }

    const payload: CreateBillPayload = {
      unitId: trimmedUnitId,
      ...(residentId ? { residentId } : {}),
      title: title.trim() || undefined,
      billType,
      billingPeriod: billingPeriod.trim() || undefined,
      description: description.trim() || undefined,
      baseAmount: parsedBaseAmount,
      dueDate,
      lateFeePerDay: parsedLateFeePerDay,
      ...(validAdditionalCharges.length > 0 ? { additionalCharges: validAdditionalCharges } : {}),
    };

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
                htmlFor="unitId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Unit / Flat
              </label>

              <select
                id="unitId"
                value={unitId}
                onChange={(event) => {
                  const selectedUnitId = event.target.value;
                  setUnitId(selectedUnitId);
                  const found = recipients.find(
                    (r) => r.unitId === selectedUnitId
                  );
                  if (found) {
                    setResidentId(found.residentId || "");
                    setResidentName(found.residentName);
                  } else {
                    setResidentId("");
                    setResidentName("");
                  }
                }}
                required
                disabled={recipientsQuery.isLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
              >
                <option value="">
                  {recipientsQuery.isLoading
                    ? "Loading units..."
                    : "Select Unit / Flat"}
                </option>
                {recipients.map((recipient) => (
                  <option
                    key={recipient.unitId}
                    value={recipient.unitId}
                  >
                    {recipient.unitName}{" "}
                    {recipient.hasResident
                      ? `— ${recipient.residentName} (${recipient.residentType || "Resident"})`
                      : "— Vacant / No Resident"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="residentName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Resident Name
              </label>

              <div className="relative">
                <input
                  id="residentName"
                  type="text"
                  value={residentName}
                  readOnly
                  placeholder={
                    unitId
                      ? "No resident assigned"
                      : "Select a unit to view resident"
                  }
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
                    selectedRecipient && !selectedRecipient.hasResident
                      ? "border-amber-200 bg-amber-50 text-amber-800 placeholder:text-amber-600"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                {selectedRecipient?.residentType ? (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-slate-200 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
                    {selectedRecipient.residentType}
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="billType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Bill Category
              </label>

              <select
                id="billType"
                value={billType}
                onChange={(e) => {
                  setBillType(e.target.value);
                  if (!title) {
                    const labels: Record<string, string> = {
                      MONTHLY_MAINTENANCE: "Monthly Maintenance",
                      WATER: "Water Bill",
                      COMMON_ELECTRICITY: "Common Electricity",
                      LIFT_MAINTENANCE: "Lift Maintenance AMC",
                      SPECIAL_REPAIR: "Special Repair Charge",
                      PARKING_MAINTENANCE: "Parking Maintenance",
                      OTHER: "Individual Fee",
                    };
                    setTitle(labels[e.target.value] || "Maintenance Bill");
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="MONTHLY_MAINTENANCE">Monthly Maintenance</option>
                <option value="WATER">Water Supply</option>
                <option value="COMMON_ELECTRICITY">Electricity</option>
                <option value="LIFT_MAINTENANCE">Lift Maintenance AMC</option>
                <option value="SPECIAL_REPAIR">Special Repair / Repair Fine</option>
                <option value="PARKING_MAINTENANCE">Parking Maintenance</option>
                <option value="OTHER">Custom / Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Bill Title (Optional)
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. October Maintenance or Balcony Repair"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="billingPeriod"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Billing Period (YYYY-MM)
              </label>

              <input
                id="billingPeriod"
                type="text"
                pattern="^\d{4}-(0[1-9]|1[0-2])$"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                placeholder="e.g. 2026-09"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description / Notes for Resident (Optional)
              </label>

              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter notes or breakdown details for this separate invoice..."
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 resize-none"
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Additional Charges (Optional)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Add extra items like Sinking Fund, Parking, Festival cess, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAdditionalCharge}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Charge
                </button>
              </div>

              {additionalCharges.length > 0 && (
                <div className="mt-3 space-y-2.5">
                  {additionalCharges.map((charge, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center"
                    >
                      <input
                        type="text"
                        placeholder="Charge Title (e.g. Sinking Fund)"
                        value={charge.title}
                        onChange={(e) =>
                          updateAdditionalCharge(index, "title", e.target.value)
                        }
                        className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount (₹)"
                        value={charge.amount}
                        onChange={(e) =>
                          updateAdditionalCharge(index, "amount", e.target.value)
                        }
                        className="w-full sm:w-28 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Reason / Note (optional)"
                        value={charge.reason}
                        onChange={(e) =>
                          updateAdditionalCharge(index, "reason", e.target.value)
                        }
                        className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalCharge(index)}
                        className="self-end sm:self-center p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition"
                        title="Remove Charge"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
