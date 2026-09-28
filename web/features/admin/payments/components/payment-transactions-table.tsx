"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Copy,
  Check,
  Building2,
} from "lucide-react"
import { format, isValid } from "date-fns"
import type { DateRange } from "react-day-picker"

import { fetchPayments, fetchBillingBreakdown } from "../api/payment.api"
import type {
  SubscriptionPaymentItem,
  PaymentStatus,
} from "../types"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Portal } from "@/components/portal"
import { cn } from "@/lib/utils"

function getSocietyInitials(name: string): string {
  if (!name) return "AP"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "—"
  try {
    const d = new Date(dateString)
    if (!isValid(d)) return "—"
    return format(d, "dd MMM yyyy, hh:mm a")
  } catch {
    return "—"
  }
}

function getBillingCycleLabel(planName: string, cycleNumber: number): string {
  const lower = (planName || "").toLowerCase()
  if (lower.includes("year")) return "Yearly"
  if (lower.includes("6") || lower.includes("six")) return "6 Months"
  if (lower.includes("month")) return "Monthly"
  return `Cycle #${cycleNumber}`
}

export function PaymentTransactionsTable() {
  const [payments, setPayments] = useState<SubscriptionPaymentItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic Plans for "All Types" filter
  const [availablePlanTypes, setAvailablePlanTypes] = useState<string[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null
    endDate: Date | null
  }>({
    startDate: null,
    endDate: null,
  })

  // Date Popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Details Modal
  const [selectedPayment, setSelectedPayment] =
    useState<SubscriptionPaymentItem | null>(null)

  // Copied Payment ID feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load registered plan types dynamically from DB (zero dummy data)
  useEffect(() => {
    async function loadPlans() {
      try {
        const breakdown = await fetchBillingBreakdown()
        if (breakdown?.plans?.length) {
          const names = Array.from(
            new Set(breakdown.plans.map((p) => p.planName).filter(Boolean))
          )
          setAvailablePlanTypes(names)
        }
      } catch {
        // Fallback silently if breakdown fails
      }
    }
    loadPlans()
  }, [])

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Fetch payments with all active filters
  const loadPayments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Parameters<typeof fetchPayments>[0] = {
        page,
        limit,
        sortBy: "paidAt",
        sortOrder: "desc",
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      if (typeFilter !== "all") {
        params.type = typeFilter
      }

      if (dateRange.startDate) {
        params.startDate = format(dateRange.startDate, "yyyy-MM-dd")
      }

      if (dateRange.endDate) {
        params.endDate = format(dateRange.endDate, "yyyy-MM-dd")
      }

      const res = await fetchPayments(params)
      setPayments(res.payments)
      setTotalCount(res.pagination.total)
      setTotalPages(res.pagination.totalPages || 1)
    } catch {
      setError("Unable to retrieve payment records.")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, typeFilter, dateRange])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

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
    setTypeFilter("all")
    setDateRange({ startDate: null, endDate: null })
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      statusFilter !== "all" ||
      typeFilter !== "all" ||
      dateRange.startDate ||
      dateRange.endDate
  )

  const handleCopyPaymentId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const renderStatusBadge = (status: SubscriptionPaymentItem["status"]) => {
    switch (status) {
      case "captured":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EE] border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#07584F]">
            <CheckCircle2 className="h-3 w-3 text-[#07584F]" />
            <span>Captured</span>
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] border border-red-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            <XCircle className="h-3 w-3 text-[#DC2626]" />
            <span>Failed</span>
          </span>
        )
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#C2410C]">
            <RotateCcw className="h-3 w-3 text-[#C2410C]" />
            <span>Refunded</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {status}
          </span>
        )
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[#EEF1EF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Header: Search & Filters (Matching Admin Section Exactly) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF1EF]">
          {/* Search Box */}
          <div className="relative flex-1 flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search apartment, plan, payment ID..."
              className="h-8.5 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-slate-600"
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
                aria-label="Filter payments by status"
                onChange={(e) => {
                  setStatusFilter(e.target.value as PaymentStatus | "all")
                  setPage(1)
                }}
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="captured">Captured</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>

            {/* Type / Plan Filter */}
            <div className="relative flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all hover:bg-slate-50 focus-within:border-[#07584F]">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={typeFilter}
                aria-label="Filter payments by type"
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {availablePlanTypes.map((pName) => (
                  <option key={pName} value={pName}>
                    {pName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>

            {/* Shadcn 2-Month Calendar Date Range Picker (Matching image exactly) */}
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

              {/* Clear date button if active */}
              {(dateRange.startDate || dateRange.endDate) && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="absolute -top-1 -right-1 z-10 flex size-3.5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition shadow-2xs"
                  title="Clear date filter"
                >
                  <X className="size-2" />
                </button>
              )}
            </div>

            {/* Clear All Filters button */}
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
                <th className="py-3 px-5">Apartment / Society</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Paid At</th>
                <th className="py-3 px-4">Status</th>
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
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-28 rounded bg-slate-200" />
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
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#07584F]">
                      <Building2 className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                      No payment records found
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
                      {hasActiveFilters
                        ? "Try clearing filters or search query to find transactions."
                        : "No subscription transactions have been recorded yet."}
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
                payments.map((payment) => {
                  const societyName = payment.apartment?.name || "Apartment"
                  const initials = getSocietyInitials(societyName)
                  const cycleLabel = getBillingCycleLabel(
                    payment.planName,
                    payment.billingCycle
                  )
                  const isCopied = copiedId === payment.razorpayPaymentId

                  return (
                    <tr
                      key={payment._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      {/* Apartment / Society */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] border border-emerald-200/80 text-xs font-bold text-[#07584F] shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                              {societyName}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {payment.apartment?.city || "City"}
                              {payment.apartment?.state
                                ? `, ${payment.apartment.state}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#0F172A]">
                          {payment.planName || "Subscription Plan"}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          {cycleLabel}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#0F172A] tabular-nums">
                          {formatINR(payment.totalAmount || payment.amount)}
                        </p>
                        {payment.taxAmount && payment.taxAmount > 0 ? (
                          <p className="text-[10px] text-[#64748B] tabular-nums">
                            + {formatINR(payment.taxAmount)} tax
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#64748B]">
                            Inclusive
                          </p>
                        )}
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {cycleLabel}
                        </span>
                      </td>

                      {/* Payment ID with copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-[#64748B] truncate max-w-[130px]">
                            {payment.razorpayPaymentId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopyPaymentId(payment.razorpayPaymentId, e)
                            }
                            title="Copy Payment ID"
                            className="rounded p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Paid At */}
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(payment.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPayment(payment)
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

        {/* Pagination Footer (Matching Admin Section Exactly) */}
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
              payments
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

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setSelectedPayment(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-200">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Transaction Receipt
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedPayment.razorpayPaymentId}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-4 text-xs">
                {/* Status and Amount Banner */}
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">
                      Total Billed
                    </span>
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                      {formatINR(
                        selectedPayment.totalAmount || selectedPayment.amount
                      )}
                    </span>
                  </div>

                  <div>{renderStatusBadge(selectedPayment.status)}</div>
                </div>

                {/* Society and Plan Details */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 p-3.5">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">
                      Apartment / Society
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {selectedPayment.apartment?.name || "Apartment"}
                    </span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">
                      {selectedPayment.apartment?.city}
                      {selectedPayment.apartment?.state
                        ? `, ${selectedPayment.apartment.state}`
                        : ""}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[11px] block">
                      Subscription Plan
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {selectedPayment.planName}
                    </span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">
                      Cycle #{selectedPayment.billingCycle}
                    </span>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="rounded-xl border border-border/70 p-3.5 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Subscription Fee</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {formatINR(selectedPayment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST / Taxes</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {formatINR(selectedPayment.taxAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/70 pt-2 font-bold text-foreground text-sm">
                    <span>Total Paid</span>
                    <span className="tabular-nums">
                      {formatINR(
                        selectedPayment.totalAmount || selectedPayment.amount
                      )}
                    </span>
                  </div>
                </div>

                {/* Payment Gateway Metadata */}
                <div className="rounded-xl bg-muted/20 p-3.5 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Razorpay Payment ID:</span>
                    <span className="text-foreground font-semibold">
                      {selectedPayment.razorpayPaymentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription ID:</span>
                    <span className="text-foreground font-semibold">
                      {selectedPayment.razorpaySubscriptionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">
                      {formatDateTime(
                        selectedPayment.paidAt || selectedPayment.createdAt
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border/70 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}

export default PaymentTransactionsTable
