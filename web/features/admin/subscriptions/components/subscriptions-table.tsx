"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  ArrowUpDown,
  CreditCard,
  Copy,
  Check,
} from "lucide-react"
import { format, isValid } from "date-fns"
import type { DateRange } from "react-day-picker"

import { fetchSubscriptions } from "../api/subscription.api"
import { fetchSubscriptionPlans } from "@/features/admin/plans/api/plan.api"
import type {
  SubscriptionItem,
  SubscriptionStatus,
  SubscriptionFilterParams,
} from "../types"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import SubscriptionDetailsDrawer, {
  renderSubscriptionStatusBadge,
} from "./subscription-details-drawer"

function getApartmentInitials(name: string): string {
  if (!name) return "AP"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatINR(amount?: number, currency = "INR"): string {
  if (typeof amount !== "number" || isNaN(amount)) return "—"
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

function formatDate(date?: string | Date | null): string {
  if (!date) return "—"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (!isValid(d)) return "—"
    return format(d, "dd MMM yyyy")
  } catch {
    return "—"
  }
}

function getBillingCycleLabel(planSnapshot?: SubscriptionItem["planSnapshot"]): string {
  if (!planSnapshot) return "—"
  const { planName = "", durationMonths, planType = "" } = planSnapshot
  const lowerName = planName.toLowerCase()
  const lowerType = planType.toLowerCase()

  if (durationMonths === 1 || lowerName.includes("monthly") || lowerType === "monthly") {
    return "Monthly"
  }
  if (durationMonths === 6 || lowerName.includes("6 month") || lowerName.includes("semi")) {
    return "6 Months"
  }
  if (durationMonths === 12 || lowerName.includes("year") || lowerName.includes("annual")) {
    return "Yearly"
  }
  if (durationMonths) {
    return `${durationMonths} Months`
  }
  return planType || "Standard"
}

export function SubscriptionsTable() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic Plans for plan filter dropdown
  const [availablePlans, setAvailablePlans] = useState<string[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null
    endDate: Date | null
  }>({
    startDate: null,
    endDate: null,
  })

  // Server-side Sorting
  const [sortBy, setSortBy] = useState<"createdAt" | "status" | "currentStart" | "currentEnd">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Date Popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Details Drawer state
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [selectedSubItem, setSelectedSubItem] = useState<SubscriptionItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Dynamic fetch of available plans from DB
  useEffect(() => {
    async function loadPlanOptions() {
      try {
        const res = await fetchSubscriptionPlans({ limit: 100, isActive: true })
        if (res?.plans?.length) {
          const names = Array.from(
            new Set(res.plans.map((p) => p.planName).filter(Boolean))
          )
          setAvailablePlans(names)
        }
      } catch {
        // Fallback silently if plans API fails
      }
    }
    loadPlanOptions()
  }, [])

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Fetch subscriptions with active server-side filters & sorting
  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: SubscriptionFilterParams = {
        page,
        limit,
        sortBy,
        sortOrder,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      if (planFilter !== "all") {
        params.plan = planFilter
      }

      if (dateRange.startDate) {
        params.startDate = format(dateRange.startDate, "yyyy-MM-dd")
      }

      if (dateRange.endDate) {
        params.endDate = format(dateRange.endDate, "yyyy-MM-dd")
      }

      const res = await fetchSubscriptions(params)
      setSubscriptions(res.subscriptions)
      setTotalCount(res.pagination.total)
      setTotalPages(res.pagination.totalPages || 1)
    } catch {
      setError("Unable to retrieve subscription records.")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, planFilter, dateRange, sortBy, sortOrder])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  // Date range mapping for Shadcn Calendar
  const selectedDayRange: DateRange | undefined = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return undefined
    return {
      from: dateRange.startDate || undefined,
      to: dateRange.endDate || undefined,
    }
  }, [dateRange.startDate, dateRange.endDate])

  const handleDaySelect = (range: DateRange | undefined) => {
    setDateRange({
      startDate: range?.from ?? null,
      endDate: range?.to ?? null,
    })
    setPage(1)
  }

  const handleClearDates = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDateRange({ startDate: null, endDate: null })
    setPage(1)
  }

  const handleClearAllFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setStatusFilter("all")
    setPlanFilter("all")
    setDateRange({ startDate: null, endDate: null })
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      statusFilter !== "all" ||
      planFilter !== "all" ||
      dateRange.startDate ||
      dateRange.endDate
  )

  const handleOpenDetails = (sub: SubscriptionItem) => {
    setSelectedSubId(sub._id)
    setSelectedSubItem(sub)
    setIsDrawerOpen(true)
  }

  const handleSortToggle = (field: "createdAt" | "status" | "currentStart" | "currentEnd") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  return (
    <>
      <div className="rounded-xl border border-[#EEF1EF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Header: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF1EF]">
          {/* Search Box */}
          <div className="relative flex-1 flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search apartment, city, plan, subscription ID..."
              className="h-8.5 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Status Filter */}
            <div className="relative flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all hover:bg-slate-50 focus-within:border-[#07584F]">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={statusFilter}
                aria-label="Filter subscriptions by status"
                onChange={(e) => {
                  setStatusFilter(e.target.value as SubscriptionStatus | "all")
                  setPage(1)
                }}
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="created">Created</option>
                <option value="authenticated">Authenticated</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="halted">Halted</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>

            {/* Plan Filter */}
            <div className="relative flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all hover:bg-slate-50 focus-within:border-[#07584F]">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={planFilter}
                aria-label="Filter subscriptions by plan"
                onChange={(e) => {
                  setPlanFilter(e.target.value)
                  setPage(1)
                }}
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Plans</option>
                {availablePlans.map((pName) => (
                  <option key={pName} value={pName}>
                    {pName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>

            {/* Date Range Picker with Shadcn Popover + Calendar */}
            <div className="relative">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:border-[#07584F] cursor-pointer",
                    (dateRange.startDate || dateRange.endDate) &&
                      "border-[#07584F] text-[#07584F] bg-[#EAF5EE]/40 font-semibold"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-[#64748B]" />
                  <span className="truncate max-w-[190px]">
                    {dateRange.startDate ? (
                      dateRange.endDate ? (
                        <>
                          {format(dateRange.startDate, "dd MMM yyyy")} –{" "}
                          {format(dateRange.endDate, "dd MMM yyyy")}
                        </>
                      ) : (
                        format(dateRange.startDate, "dd MMM yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-150",
                      isCalendarOpen && "rotate-180"
                    )}
                  />
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto p-0 border border-[#E2E8F0] bg-white shadow-xl rounded-xl overflow-hidden"
                  align="end"
                  side="bottom"
                  sideOffset={6}
                >
                  <div className="p-3 bg-white">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange.startDate || new Date()}
                      selected={selectedDayRange}
                      onSelect={handleDaySelect}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear date button */}
              {(dateRange.startDate || dateRange.endDate) && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="absolute -top-1 -right-1 z-10 flex size-3.5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition shadow-2xs cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="size-2" />
                </button>
              )}
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-[#CBD5E1] bg-white px-2.5 text-xs font-medium text-[#64748B] hover:border-slate-400 hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EEF1EF] bg-slate-50/70 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                <th className="py-3 px-5">Apartment / Community</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Amount</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSortToggle("currentStart")}
                >
                  <div className="flex items-center gap-1">
                    <span>Start Date</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSortToggle("currentEnd")}
                >
                  <div className="flex items-center gap-1">
                    <span>Next Renewal</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSortToggle("status")}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#334155]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-32 rounded bg-slate-200" />
                          <div className="h-2.5 w-44 rounded bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-16 rounded-full bg-slate-200" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-7 w-16 rounded bg-slate-200 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#07584F]">
                      <Building2 className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                      {hasActiveFilters
                        ? "No subscriptions match your filters."
                        : "No subscriptions found"}
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
                      {hasActiveFilters
                        ? "Try clearing filters or search query to find subscriptions."
                        : "No apartment community subscriptions have been recorded yet."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#07584F] shadow-2xs hover:bg-[#EAF5EE] transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const apartmentName = sub.apartment?.name || "Apartment"
                  const initials = getApartmentInitials(apartmentName)
                  const cycleLabel = getBillingCycleLabel(sub.planSnapshot)
                  const startDate = formatDate(sub.currentStart || sub.startAt || sub.createdAt)
                  const renewalDate =
                    sub.status === "pending" || (!sub.chargeAt && !sub.currentEnd && !sub.endAt)
                      ? "—"
                      : formatDate(sub.chargeAt || sub.currentEnd || sub.endAt)

                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(sub)}
                    >
                      {/* Apartment / Community */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] border border-emerald-200/80 text-xs font-bold text-[#07584F] shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                              {apartmentName}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {sub.apartment?.city || "City"}
                              {sub.apartment?.state ? `, ${sub.apartment.state}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0F172A]">
                          {sub.planSnapshot?.planName || "—"}
                        </p>
                        {sub.isTrial && (
                          <span className="inline-flex text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                            Trial
                          </span>
                        )}
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {cycleLabel}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#0F172A] tabular-nums">
                          {formatINR(sub.planSnapshot?.price, sub.planSnapshot?.currency)}
                        </p>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        {startDate}
                      </td>

                      {/* Next Renewal */}
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        {renewalDate}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderSubscriptionStatusBadge(sub.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDetails(sub)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#07584F] shadow-2xs hover:bg-[#EAF5EE] hover:border-emerald-300 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#07584F]" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between border-t border-[#EEF1EF]">
            <p className="text-xs text-[#64748B]">
              Showing{" "}
              <span className="font-semibold text-[#334155]">
                {Math.min((page - 1) * limit + 1, totalCount)}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-[#334155]">
                {Math.min(page * limit, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#334155]">{totalCount}</span>{" "}
              subscriptions
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="px-2 text-xs font-medium text-[#64748B] tabular-nums">
                {page} / {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Details Drawer */}
      <SubscriptionDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        subscriptionId={selectedSubId}
        initialSubscription={selectedSubItem}
      />
    </>
  )
}

export default SubscriptionsTable
