"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan, CreatePlanInput, UpdatePlanInput } from "../types"
import { createSubscriptionPlan, updateSubscriptionPlan } from "../api/plan.api"

type PlanFormProps = {
  mode: "create" | "edit"
  initialData?: SubscriptionPlan | null
}

export default function PlanForm({ mode, initialData }: PlanFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit"

  // Form states - completely free-form inputs with standard styling
  const [planName, setPlanName] = useState(initialData?.planName || "")
  const [planType, setPlanType] = useState(initialData?.planType || "")
  const [price, setPrice] = useState<number | "">(initialData?.price ?? "")
  const [durationMonths, setDurationMonths] = useState<number | "">(
    initialData?.durationMonths ?? 12
  )
  const [razorpayPlanId, setRazorpayPlanId] = useState(
    initialData?.razorpayPlanId || ""
  )
  const [trialEnabled, setTrialEnabled] = useState(
    Boolean(initialData?.freeTrial?.enabled)
  )
  const [trialDays, setTrialDays] = useState<number | "">(
    initialData?.freeTrial?.days ?? 14
  )
  const [features, setFeatures] = useState<string[]>(initialData?.features || [])
  const [featureInput, setFeatureInput] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Feature handling
  const handleAddFeature = () => {
    const trimmed = featureInput.trim()
    if (!trimmed) return
    if (features.includes(trimmed)) {
      toast.info("Feature already added")
      return
    }
    setFeatures([...features, trimmed])
    setFeatureInput("")
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  // Monthly breakdown calculation
  const monthlyRate =
    price !== "" && durationMonths !== "" && Number(durationMonths) > 0
      ? Math.round(Number(price) / Number(durationMonths))
      : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!planName.trim()) {
      setErrorMessage("Please enter a plan name.")
      return
    }

    if (!planType.trim()) {
      setErrorMessage("Please enter a plan type key (e.g. starter, premium, annual_pro).")
      return
    }

    if (price === "" || Number(price) < 0) {
      setErrorMessage("Please enter a valid price (>= 0).")
      return
    }

    if (durationMonths === "" || Number(durationMonths) < 1) {
      setErrorMessage("Duration must be at least 1 month.")
      return
    }

    if (!razorpayPlanId.trim()) {
      setErrorMessage("Razorpay Plan ID is required.")
      return
    }

    if (trialEnabled && (trialDays === "" || Number(trialDays) <= 0)) {
      setErrorMessage("Trial duration must be at least 1 day when trial is enabled.")
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedPlanType = planType.trim().toLowerCase().replace(/\s+/g, "_")

      if (isEditing && initialData) {
        const updatePayload: UpdatePlanInput = {
          planName: planName.trim(),
          planType: normalizedPlanType,
          price: Number(price),
          durationMonths: Number(durationMonths),
          razorpayPlanId: razorpayPlanId.trim(),
          features: features.length > 0 ? features : undefined,
          freeTrial: {
            enabled: trialEnabled,
            days: trialEnabled ? Number(trialDays) : 0,
          },
        }

        await updateSubscriptionPlan(initialData._id, updatePayload)
        toast.success(`Plan "${planName}" updated successfully`)
      } else {
        const createPayload: CreatePlanInput = {
          planName: planName.trim(),
          planType: normalizedPlanType,
          price: Number(price),
          durationMonths: Number(durationMonths),
          razorpayPlanId: razorpayPlanId.trim(),
          features,
          freeTrial: {
            enabled: trialEnabled,
            days: trialEnabled ? Number(trialDays) : 0,
          },
        }

        await createSubscriptionPlan(createPayload)
        toast.success(`Plan "${planName}" created successfully`)
      }

      router.push("/admin/plans")
      router.refresh()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        "Failed to save plan. Please check Razorpay Plan ID and ensure plan type is unique."
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Subscription Plans</span>
        </Link>
      </div>

      {/* Main Form Container Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        {/* Card Header */}
        <div className="pb-6 border-b border-slate-100">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            {isEditing ? "Edit Subscription Plan" : "Create New Subscription Plan"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
            {isEditing
              ? "Update plan pricing, billing duration, Razorpay linkage, and capabilities."
              : "Define a new society subscription tier with custom pricing and duration."}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to save plan</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* SECTION 1: General Plan Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
              1. General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Display Name */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Plan Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Community Starter, Enterprise Annual"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden focus:ring-1 focus:ring-[#07584F] transition-all"
                />
              </div>

              {/* Plan Type Key */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Plan Type Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. starter, premium, society_pro"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden focus:ring-1 focus:ring-[#07584F] transition-all font-mono"
                />
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Normalized key:{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[10.5px] text-[#07584F] font-mono">
                    {planType.trim().toLowerCase().replace(/\s+/g, "_") || "type_key"}
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Pricing & Duration (Free input - any price and months) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
              2. Pricing &amp; Duration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Price */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Total Plan Price (INR ₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 4999"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden focus:ring-1 focus:ring-[#07584F] font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Duration in Months */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Duration (Months) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1, 3, 6, 12, 24"
                    value={durationMonths}
                    onChange={(e) =>
                      setDurationMonths(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden focus:ring-1 focus:ring-[#07584F] font-semibold transition-all"
                  />
                </div>
                {durationMonths !== "" && Number(durationMonths) > 1 && monthlyRate > 0 && (
                  <p className="mt-1 text-[11px] text-[#07584F] font-medium">
                    Equivalent rate: ≈ {formatCurrency(monthlyRate)} / month
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Razorpay Payment Gateway */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
              3. Payment Gateway
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Razorpay Plan ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. plan_N3x98aBCDef..."
                value={razorpayPlanId}
                onChange={(e) => setRazorpayPlanId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden focus:ring-1 focus:ring-[#07584F] font-mono transition-all"
              />
              <p className="mt-1 text-[11px] text-[#64748B]">
                Enter the Plan ID configured in your Razorpay Dashboard for recurring billing.
              </p>
            </div>
          </div>

          {/* SECTION 4: Free Trial */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
                  4. Free Trial Policy
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Allow societies to try the tier before recurring invoicing begins.
                </p>
              </div>

              {/* Standard Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={trialEnabled}
                  onChange={(e) => setTrialEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07584F]"></div>
              </label>
            </div>

            {trialEnabled && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 animate-in fade-in">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Trial Duration (Days) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14"
                    value={trialDays}
                    onChange={(e) =>
                      setTrialDays(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-32 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-[#0F172A] focus:border-[#07584F] focus:outline-hidden"
                  />
                  <span className="text-xs text-[#64748B]">days free trial</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Features Checklist (Direct input, no auto suggestions) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#07584F]">
                  5. Plan Features &amp; Capabilities ({features.length})
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Type features included in this tier.
                </p>
              </div>

              {features.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFeatures([])}
                  className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Feature Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter a feature and press Enter..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#064C44] transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Feature List */}
            <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40 p-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2 border border-slate-100 shadow-2xs text-xs text-[#334155]"
                >
                  <span className="font-medium truncate mr-2">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors shrink-0"
                    title="Remove feature"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {features.length === 0 && (
                <p className="text-center py-4 text-xs text-[#94A3B8] italic">
                  No features added yet. Type a feature name above and click Add.
                </p>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/admin/plans"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#07584F] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Plan...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Plan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
