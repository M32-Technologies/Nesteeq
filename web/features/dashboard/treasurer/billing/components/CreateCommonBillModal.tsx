"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpCircle,
  Building,
  Building2,
  Car,
  CheckCircle2,
  DollarSign,
  FileText,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { getBillRecipients } from "../services/billing.service";
import type {
  AdditionalCharge,
  BillRecipient,
  CreateCommonBillPayload,
} from "../types/billing.types";

interface CreateCommonBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateCommonBillPayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

const BILL_PRESETS = [
  {
    type: "MONTHLY_MAINTENANCE",
    label: "Monthly Maintenance",
    badge: "Essential",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Building,
    defaultName: "Monthly Maintenance",
    description: "Regular charges for common cleaning, security guards, shared lighting, and general upkeep.",
  },
  {
    type: "LIFT_MAINTENANCE",
    label: "Lift Maintenance AMC",
    badge: "Facility",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: ArrowUpCircle,
    defaultName: "Lift AMC & Inspection",
    description: "Elevator annual maintenance contracts, safety certification, and quarterly servicing.",
  },
  {
    type: "SPECIAL_REPAIR",
    label: "Special / One-Time Repair",
    badge: "One-Time",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    icon: Wrench,
    defaultName: "Society Repair Contribution",
    description: "Unexpected building repairs, painting, terrace waterproofing, or equipment replacements.",
  },
  {
    type: "PARKING_MAINTENANCE",
    label: "Parking Maintenance",
    badge: "Facility",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Car,
    defaultName: "Parking Facility Maintenance",
    description: "Basement cleaning, boom barrier servicing, CCTV monitoring, and slot marking.",
  },
  {
    type: "OTHER",
    label: "Other / Custom Bill",
    badge: "Custom",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    icon: FileText,
    defaultName: "Society Contribution",
    description: "Festival celebrations, clubhouse event fees, generator fuel, or custom levies.",
  },
] as const;

const getCurrentMonthPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getDefaultDueDate = () => {
  const now = new Date();
  now.setDate(now.getDate() + 15);
  return now.toISOString().split("T")[0];
};

const formatMonthName = (periodStr: string) => {
  try {
    const [y, m] = periodStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return periodStr;
  }
};

export default function CreateCommonBillModal({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
}: CreateCommonBillModalProps) {
  const periodInputId = useId();
  const titleInputId = useId();
  const baseAmountInputId = useId();
  const dueDateInputId = useId();
  const lateFeeInputId = useId();
  const descriptionInputId = useId();

  const [billType, setBillType] = useState<string>("MONTHLY_MAINTENANCE");
  const [billingPeriod, setBillingPeriod] = useState(getCurrentMonthPeriod());
  const [hasPeriod, setHasPeriod] = useState(true);
  const [title, setTitle] = useState(
    `${formatMonthName(getCurrentMonthPeriod())} Maintenance`
  );
  const [isTitleManual, setIsTitleManual] = useState(false);
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [lateFeePerDay, setLateFeePerDay] = useState("0");
  const [targetType, setTargetType] = useState<
    "ALL_FLATS" | "BY_BLOCK" | "CUSTOM_FLATS"
  >("ALL_FLATS");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [flatSearch, setFlatSearch] = useState<string>("");
  const [selectedFlatIds, setSelectedFlatIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [additionalCharges, setAdditionalCharges] = useState<
    { title: string; amount: string; reason: string }[]
  >([]);

  // Fetch recipients to display real-time flat statistics
  const recipientsQuery = useQuery<BillRecipient[]>({
    queryKey: ["bill-recipients"],
    queryFn: () => getBillRecipients(),
    enabled: isOpen,
  });

  const recipients = recipientsQuery.data ?? [];

  const availableBlocks = useMemo(() => {
    const map = new Map<string, string>();
    recipients.forEach((r) => {
      if (r.blockId && r.blockName) {
        map.set(r.blockId, r.blockName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [recipients]);

  // Automatic title generator based on type & period
  const handleBillTypeChange = (type: string) => {
    setBillType(type);
    const preset = BILL_PRESETS.find((p) => p.type === type);
    if (!isTitleManual) {
      if (hasPeriod && billingPeriod) {
        setTitle(`${formatMonthName(billingPeriod)} ${preset?.defaultName || "Bill"}`);
      } else {
        setTitle(preset?.defaultName || "Society Bill");
      }
    }
  };

  const handlePeriodChange = (period: string) => {
    setBillingPeriod(period);
    if (!isTitleManual) {
      const preset = BILL_PRESETS.find((p) => p.type === billType);
      setTitle(`${formatMonthName(period)} ${preset?.defaultName || "Bill"}`);
    }
  };

  // Additional charges dynamic rows
  const addChargeRow = () => {
    setAdditionalCharges((prev) => [
      ...prev,
      { title: "", amount: "", reason: "" },
    ]);
  };

  const removeChargeRow = (index: number) => {
    setAdditionalCharges((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChargeRow = (
    index: number,
    field: "title" | "amount" | "reason",
    value: string
  ) => {
    setAdditionalCharges((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Real-time computations
  const parsedBase = Number(baseAmount) || 0;
  const parsedAddChargesTotal = additionalCharges.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  );
  const totalPerFlat = parsedBase + parsedAddChargesTotal;

  const targetCount = useMemo(() => {
    if (targetType === "ALL_FLATS") {
      return recipients.length;
    }
    if (targetType === "BY_BLOCK") {
      return selectedBlockId
        ? recipients.filter((r) => r.blockId === selectedBlockId).length
        : 0;
    }
    if (targetType === "CUSTOM_FLATS") {
      return selectedFlatIds.length;
    }
    return recipients.length;
  }, [targetType, recipients, selectedBlockId, selectedFlatIds]);

  const grandTotalAmount = totalPerFlat * targetCount;

  const handleToggleFlat = (unitId: string) => {
    setSelectedFlatIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId]
    );
  };

  const filteredRecipients = useMemo(() => {
    if (!flatSearch.trim()) return recipients;
    const q = flatSearch.toLowerCase().trim();
    return recipients.filter(
      (r) =>
        r.unitName.toLowerCase().includes(q) ||
        r.flatNumber.toLowerCase().includes(q) ||
        r.residentName.toLowerCase().includes(q)
    );
  }, [recipients, flatSearch]);

  const handleSelectAllFlats = () => {
    setSelectedFlatIds(recipients.map((r) => r.unitId));
  };

  const handleDeselectAllFlats = () => {
    setSelectedFlatIds([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a bill title.");
      return;
    }

    if (!parsedBase || parsedBase <= 0) {
      setError("Base amount must be greater than 0.");
      return;
    }

    if (!dueDate) {
      setError("Please select a valid due date.");
      return;
    }

    if (targetType === "BY_BLOCK" && !selectedBlockId) {
      setError("Please select a block / tower.");
      return;
    }

    if (targetType === "CUSTOM_FLATS" && selectedFlatIds.length === 0) {
      setError("Please select at least one unit to bill.");
      return;
    }

    if (targetCount === 0) {
      setError("No units found to bill for the selected criteria.");
      return;
    }

    const payload: CreateCommonBillPayload = {
      title: title.trim(),
      billType,
      billingPeriod: hasPeriod && billingPeriod ? billingPeriod : null,
      description: description.trim() || null,
      baseAmount: parsedBase,
      additionalCharges: additionalCharges
        .filter((c) => c.title.trim() && Number(c.amount) > 0)
        .map((c) => ({
          title: c.title.trim(),
          amount: Number(c.amount),
          reason: c.reason.trim() || undefined,
        })),
      lateFeePerDay: Number(lateFeePerDay) || 0,
      dueDate,
      targetType,
      targetBlockIds: targetType === "BY_BLOCK" && selectedBlockId ? [selectedBlockId] : undefined,
      targetFlatIds:
        targetType === "CUSTOM_FLATS"
          ? selectedFlatIds
          : targetType === "BY_BLOCK" && selectedBlockId
            ? recipients.filter((r) => r.blockId === selectedBlockId).map((r) => r.unitId)
            : undefined,
    };

    try {
      await onCreate(payload);
    } catch (err: any) {
      setError(err?.message || "Failed to create common bills.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Broadcast Common Society Bill
              </h2>
              <p className="text-xs text-slate-500">
                Generate and distribute maintenance or utility charges across resident flats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection Grid */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Common Bill Category
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {BILL_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = billType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleBillTypeChange(preset.type)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20"
                        : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className={`rounded-lg p-1.5 ${
                          isSelected
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-700 shadow-sm border border-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          isSelected
                            ? "border-white/20 bg-white/10 text-white"
                            : preset.badgeColor
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </div>
                    <span className="mt-2.5 text-xs font-semibold leading-tight line-clamp-1">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Billing Details & Title */}
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={periodInputId}
                  className="text-xs font-semibold text-slate-700"
                >
                  Billing Period
                </label>
                <button
                  type="button"
                  onClick={() => setHasPeriod(!hasPeriod)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  {hasPeriod ? "No Period" : "Add Period"}
                </button>
              </div>
              <div className="mt-1.5">
                <input
                  id={periodInputId}
                  type="month"
                  disabled={!hasPeriod}
                  value={billingPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="sm:col-span-8">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={titleInputId}
                  className="text-xs font-semibold text-slate-700"
                >
                  Bill Title
                </label>
                {isTitleManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTitleManual(false);
                      const preset = BILL_PRESETS.find((p) => p.type === billType);
                      setTitle(
                        hasPeriod && billingPeriod
                          ? `${formatMonthName(billingPeriod)} ${preset?.defaultName || "Bill"}`
                          : preset?.defaultName || "Society Bill"
                      );
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Reset to auto
                  </button>
                )}
              </div>
              <input
                id={titleInputId}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsTitleManual(true);
                }}
                placeholder="e.g. September 2026 Maintenance"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                required
              />
            </div>

            <div className="sm:col-span-12">
              <label
                htmlFor={descriptionInputId}
                className="text-xs font-semibold text-slate-700"
              >
                Description / Memo (Visible to Residents)
              </label>
              <textarea
                id={descriptionInputId}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes or detailed explanation for residents..."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 resize-none"
              />
            </div>
          </div>

          {/* 3. Amounts & Due Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor={baseAmountInputId}
                className="text-xs font-semibold text-slate-700"
              >
                Base Amount (₹ per flat) *
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                <input
                  id={baseAmountInputId}
                  type="number"
                  min="1"
                  step="any"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="2000"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs font-semibold text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={dueDateInputId}
                className="text-xs font-semibold text-slate-700"
              >
                Payment Due Date *
              </label>
              <input
                id={dueDateInputId}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                required
              />
            </div>

            <div>
              <label
                htmlFor={lateFeeInputId}
                className="text-xs font-semibold text-slate-700"
              >
                Late Fee (₹ per day after due date)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                <input
                  id={lateFeeInputId}
                  type="number"
                  min="0"
                  step="any"
                  value={lateFeePerDay}
                  onChange={(e) => setLateFeePerDay(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 4. Additional Charges Builder */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized Charges & Surcharges (Optional)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Add line-item charges like festival fund, lift diesel, or sinking fund
                </p>
              </div>
              <button
                type="button"
                onClick={addChargeRow}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            {additionalCharges.length > 0 && (
              <div className="mt-3 space-y-2">
                {additionalCharges.map((charge, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={charge.title}
                      onChange={(e) => updateChargeRow(index, "title", e.target.value)}
                      placeholder="e.g. Sinking Fund"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={charge.amount}
                        onChange={(e) => updateChargeRow(index, "amount", e.target.value)}
                        placeholder="250"
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-6 pr-2 text-xs text-slate-800"
                      />
                    </div>
                    <input
                      type="text"
                      value={charge.reason}
                      onChange={(e) => updateChargeRow(index, "reason", e.target.value)}
                      placeholder="Reason (optional)"
                      className="w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeChargeRow(index)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Audience / Target Flat Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              5. Select Target Audience
            </label>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                  targetType === "ALL_FLATS"
                    ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === "ALL_FLATS"}
                    onChange={() => setTargetType("ALL_FLATS")}
                    className="h-4 w-4 text-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      All Society Flats ({recipients.length})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Entire complex
                    </p>
                  </div>
                </div>
                <Users className="h-4 w-4 text-slate-400" />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                  targetType === "BY_BLOCK"
                    ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === "BY_BLOCK"}
                    onChange={() => setTargetType("BY_BLOCK")}
                    className="h-4 w-4 text-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      By Block / Tower
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {availableBlocks.length} block(s) found
                    </p>
                  </div>
                </div>
                <Building2 className="h-4 w-4 text-slate-400" />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                  targetType === "CUSTOM_FLATS"
                    ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === "CUSTOM_FLATS"}
                    onChange={() => setTargetType("CUSTOM_FLATS")}
                    className="h-4 w-4 text-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      Custom Flats ({selectedFlatIds.length})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Manual checklist
                    </p>
                  </div>
                </div>
                <Building className="h-4 w-4 text-slate-400" />
              </label>
            </div>

            {targetType === "BY_BLOCK" && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <span className="text-xs font-semibold text-slate-700">Choose Block / Tower to Bill:</span>
                {availableBlocks.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">No distinct blocks configured for flats in this society.</p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {availableBlocks.map((blk) => {
                      const isSelected = selectedBlockId === blk.id;
                      const count = recipients.filter((r) => r.blockId === blk.id).length;
                      return (
                        <button
                          key={blk.id}
                          type="button"
                          onClick={() => setSelectedBlockId(blk.id)}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {blk.name} ({count} flats)
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {targetType === "CUSTOM_FLATS" && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <input
                    type="text"
                    placeholder="Filter units..."
                    value={flatSearch}
                    onChange={(e) => setFlatSearch(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none w-48"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFlats}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllFlats}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {filteredRecipients.map((rec) => {
                      const isChecked = selectedFlatIds.includes(rec.unitId);
                      return (
                        <button
                          key={rec.unitId}
                          type="button"
                          onClick={() => handleToggleFlat(rec.unitId)}
                          className={`flex items-center justify-between rounded-lg border p-2 text-left text-xs transition cursor-pointer ${
                            isChecked
                              ? "border-slate-900 bg-slate-900 text-white font-medium"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{rec.unitName}</div>
                            <div className="text-[10px] opacity-80 truncate max-w-[100px]">
                              {rec.residentName}
                            </div>
                          </div>
                          {isChecked && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Summary Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-indigo-950">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Batch Generation Summary
                </span>
                <p className="text-xs text-indigo-900">
                  <strong className="font-semibold">₹{totalPerFlat.toLocaleString("en-IN")}</strong> per flat &bull; Targeting{" "}
                  <strong className="font-semibold">{targetCount} units</strong>
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-right">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                Total Society Receivables
              </span>
              <div className="text-xl font-black text-indigo-950">
                ₹{grandTotalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || targetCount === 0}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-md"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Broadcasting Bills...</span>
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  <span>Generate {targetCount} Bills (₹{grandTotalAmount.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
