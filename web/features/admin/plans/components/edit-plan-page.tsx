"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import PlanForm from "@/features/admin/plans/components/plan-form"
import { fetchSubscriptionPlanById } from "@/features/admin/plans/api/plan.api"
import type { SubscriptionPlan } from "@/features/admin/plans/types"

type EditPlanPageProps = {
  planId: string
}

export default function EditPlanPage({ planId }: EditPlanPageProps) {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return

    async function loadPlan() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchSubscriptionPlanById(planId)
        setPlan(data)
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Failed to load subscription plan."
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlan()
  }, [planId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-[#07584F] animate-spin mb-3" />
        <p className="text-xs text-[#64748B]">Loading subscription plan details...</p>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Plans</span>
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-red-900">Subscription Plan Not Found</h3>
            <p className="mt-1">{error || "The requested subscription plan does not exist or was deleted."}</p>
          </div>
        </div>
      </div>
    )
  }

  return <PlanForm mode="edit" initialData={plan} />
}
