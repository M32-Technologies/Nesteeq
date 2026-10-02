"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  AlertCircle,
  CreditCard,
  X,
} from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan, PlanFilterStatus } from "@/features/admin/plans/types"
import {
  fetchSubscriptionPlans,
  updateSubscriptionPlanStatus,
} from "@/features/admin/plans/api/plan.api"
import PlanKpiCards from "@/features/admin/plans/components/plan-kpi-cards"
import PlanCard from "@/features/admin/plans/components/plan-card"
import PlanDetailsDrawer from "@/features/admin/plans/components/plan-details-drawer"

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PlanFilterStatus>("all")

  // Details Drawer
  const [selectedPlanForDrawer, setSelectedPlanForDrawer] =
    useState<SubscriptionPlan | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch plans from backend API
  const loadPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const isActiveParam =
        statusFilter === "active"
          ? true
          : statusFilter === "inactive"
          ? false
          : undefined

      const res = await fetchSubscriptionPlans({
        search: debouncedSearch.trim() || undefined,
        isActive: isActiveParam,
        limit: 100, // Load all configured plans for admin review
        sortBy: "createdAt",
        sortOrder: "desc",
      })

      setPlans(res.plans || [])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load subscription plans from the server."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  // Handle status toggle with optimistic update
  const handleToggleStatus = async (
    plan: SubscriptionPlan,
    newStatus: boolean
  ) => {
    // Optimistic update
    setPlans((prev) =>
      prev.map((p) => (p._id === plan._id ? { ...p, isActive: newStatus } : p))
    )
    if (selectedPlanForDrawer?._id === plan._id) {
      setSelectedPlanForDrawer((prev) =>
        prev ? { ...prev, isActive: newStatus } : null
      )
    }

    try {
      await updateSubscriptionPlanStatus(plan._id, newStatus)
      toast.success(
        `${plan.planName} has been ${newStatus ? "activated" : "deactivated"}.`
      )
    } catch (err: unknown) {
      // Revert on failure
      setPlans((prev) =>
        prev.map((p) =>
          p._id === plan._id ? { ...p, isActive: plan.isActive } : p
        )
      )
      if (selectedPlanForDrawer?._id === plan._id) {
        setSelectedPlanForDrawer(plan)
      }

      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update plan status."
      toast.error(msg)
    }
  }

  // Open drawer
  const handleViewDetails = (plan: SubscriptionPlan) => {
    setSelectedPlanForDrawer(plan)
    setIsDetailsOpen(true)
  }

  // Navigate to create plan page
  const handleOpenCreate = () => {
    router.push("/admin/plans/new")
  }

  // Navigate to edit plan page
  const handleOpenEdit = (plan: SubscriptionPlan) => {
    router.push(`/admin/plans/${plan._id}/edit`)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Stats Strip */}
      <PlanKpiCards plans={plans} isLoading={isLoading} />

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to fetch plans</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadPlans()}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Bar with Create Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by plan name or type key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50/60 pl-10 pr-9 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#07584F] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Segmented Filter & Create Action */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            {(["all", "active", "inactive"] as PlanFilterStatus[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link
            href="/admin/plans/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition-all hover:shadow-[0_4px_16px_rgba(7,88,79,0.25)]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Plan</span>
          </Link>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 w-20 bg-slate-100 rounded" />
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
                <div className="h-6 w-36 bg-slate-100 rounded mb-3" />
                <div className="h-9 w-28 bg-slate-100 rounded mb-6" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-50 rounded" />
                  <div className="h-4 w-5/6 bg-slate-50 rounded" />
                  <div className="h-4 w-4/6 bg-slate-50 rounded" />
                </div>
              </div>
              <div className="h-9 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#07584F]">
            <CreditCard className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0F172A]">
            {searchTerm || statusFilter !== "all"
              ? "No matching subscription plans"
              : "No subscription plans configured yet"}
          </h3>

          <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search query or reset your status filter to view all plans."
              : "Create your first tiered pricing plan to enable apartment societies to subscribe."}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            {searchTerm || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/admin/plans/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Plan</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onViewDetails={handleViewDetails}
              onEdit={handleOpenEdit}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      <PlanDetailsDrawer
        plan={selectedPlanForDrawer}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedPlanForDrawer(null)
        }}
        onEdit={(plan) => {
          setIsDetailsOpen(false)
          handleOpenEdit(plan)
        }}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  )
}
