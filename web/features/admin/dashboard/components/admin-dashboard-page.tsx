"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  CreditCard,
  Layers,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Users,
  RefreshCw,
  FileText,
  ShieldCheck,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { format, isValid } from "date-fns"

import {
  fetchApartmentStats,
  fetchApartments,
  fetchApartmentAnalytics,
} from "@/features/admin/apartments/api/apartment.api"
import type {
  ApartmentStats,
  ApartmentItem,
  ApartmentAnalyticsData,
} from "@/features/admin/apartments/types"

import { fetchSubscriptionStats } from "@/features/admin/subscriptions/api/subscription.api"
import type { SubscriptionStats } from "@/features/admin/subscriptions/types"

import {
  fetchRevenueStats,
  fetchPayments,
} from "@/features/admin/payments/api/payment.api"
import type {
  RevenueStats,
  SubscriptionPaymentItem,
} from "@/features/admin/payments/types"

function formatINR(amount?: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0"
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—"
  try {
    const d = new Date(dateString)
    if (!isValid(d)) return "—"
    return format(d, "dd MMM yyyy")
  } catch {
    return "—"
  }
}

function getInitials(name: string): string {
  if (!name) return "AP"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function AdminDashboardPage() {
  const [aptStats, setAptStats] = useState<ApartmentStats | null>(null)
  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null)
  const [revStats, setRevStats] = useState<RevenueStats | null>(null)
  const [recentApartments, setRecentApartments] = useState<ApartmentItem[]>([])
  const [recentPayments, setRecentPayments] = useState<SubscriptionPaymentItem[]>([])
  const [analytics, setAnalytics] = useState<ApartmentAnalyticsData | null>(null)
  const [range, setRange] = useState<"3m" | "6m" | "12m">("6m")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [
        aptRes,
        subRes,
        revRes,
        analyticsRes,
        recentAptsRes,
        recentPaymentsRes,
      ] = await Promise.allSettled([
        fetchApartmentStats(),
        fetchSubscriptionStats(),
        fetchRevenueStats(),
        fetchApartmentAnalytics(range),
        fetchApartments({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
        fetchPayments({ limit: 5, sortBy: "paidAt", sortOrder: "desc" }),
      ])

      if (aptRes.status === "fulfilled") setAptStats(aptRes.value)
      if (subRes.status === "fulfilled") setSubStats(subRes.value)
      if (revRes.status === "fulfilled") setRevStats(revRes.value)
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value)
      if (recentAptsRes.status === "fulfilled") {
        setRecentApartments(recentAptsRes.value.apartments || [])
      }
      if (recentPaymentsRes.status === "fulfilled") {
        setRecentPayments(recentPaymentsRes.value.payments || [])
      }
    } catch {
      setError("Unable to sync dashboard telemetry from backend services.")
    } finally {
      setIsLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Real backend metric calculations
  const totalSocieties = aptStats?.total ?? 0
  const activeSocieties = aptStats?.active ?? 0
  const pendingSocieties = aptStats?.pending_payment ?? 0

  const activeSubscriptions = subStats?.active ?? 0
  const totalSubscriptions = subStats?.total ?? 0
  const pendingSubscriptions = subStats?.pending ?? 0
  const expiringSoonSubscriptions = subStats?.expiringSoon ?? 0

  const totalRevenue = revStats?.totalRevenue ?? 0
  const monthRevenue = revStats?.revenueThisMonth ?? 0

  // Action items count (expiring subscriptions + pending onboarding)
  const actionItemsCount = expiringSoonSubscriptions + pendingSocieties

  // Active operational rate
  const activeCoveragePercent =
    totalSocieties > 0 ? Math.round((activeSocieties / totalSocieties) * 100) : 0

  // Real registration analytics data from API
  const chartData =
    analytics?.registrations && analytics.registrations.length > 0
      ? analytics.registrations.map((r) => ({
          period: r.period,
          registrations: r.count,
        }))
      : []

  const totalRegistrationsInRange = chartData.reduce(
    (acc, curr) => acc + curr.registrations,
    0
  )

  return (
    <div className="w-full space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Dashboard Sync Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. EXECUTIVE KPI METRICS (4 Core Platform Pillars)        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Societies */}
        <Link
          href="/admin/apartments"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-emerald-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">
              Managed Communities
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] group-hover:scale-105 transition-transform">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
              {isLoading ? (
                <span className="inline-block h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                totalSocieties
              )}
            </p>
            <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1.5 truncate">
              <span className="font-semibold text-[#07584F]">
                {activeSocieties} active
              </span>
              <span>·</span>
              <span>{pendingSocieties} onboarding</span>
            </p>
          </div>
        </Link>

        {/* Metric 2: Active Subscriptions */}
        <Link
          href="/admin/subscriptions"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-emerald-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">
              Active Subscriptions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] group-hover:scale-105 transition-transform">
              <Layers className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
              {isLoading ? (
                <span className="inline-block h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                activeSubscriptions
              )}
            </p>
            <p className="mt-1 text-xs text-[#64748B] truncate">
              <span className="font-semibold text-slate-700">
                {totalSubscriptions} total
              </span>{" "}
              registered plans
            </p>
          </div>
        </Link>

        {/* Metric 3: Platform Revenue */}
        <Link
          href="/admin/payments"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-emerald-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">
              Total Platform Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] group-hover:scale-105 transition-transform">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums truncate">
              {isLoading ? (
                <span className="inline-block h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                formatINR(totalRevenue)
              )}
            </p>
            <p className="mt-1 text-xs text-[#64748B] truncate">
              <span className="font-semibold text-[#07584F]">
                {formatINR(monthRevenue)}
              </span>{" "}
              captured this month
            </p>
          </div>
        </Link>

        {/* Metric 4: Action Radar */}
        <Link
          href="/admin/subscriptions"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-amber-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">
              Attention Required
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                actionItemsCount > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-[#EAF5EE] text-[#07584F]"
              }`}
            >
              {actionItemsCount > 0 ? (
                <AlertCircle className="h-4.5 w-4.5" />
              ) : (
                <CheckCircle2 className="h-4.5 w-4.5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
              {isLoading ? (
                <span className="inline-block h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                actionItemsCount
              )}
            </p>
            <p className="mt-1 text-xs text-[#64748B] truncate">
              {actionItemsCount > 0 ? (
                <>
                  <span className="font-semibold text-amber-700">
                    {expiringSoonSubscriptions} expiring soon
                  </span>
                  <span> · </span>
                  <span>{pendingSocieties} pending</span>
                </>
              ) : (
                <span className="font-semibold text-[#07584F]">
                  All systems operational
                </span>
              )}
            </p>
          </div>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 2. PLATFORM ADOPTION & OPERATIONAL TELEMETRY              */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Growth Trajectory (Area Chart - 8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Platform Growth Trajectory
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                New apartment communities registered over time
              </p>
            </div>

            {/* Range Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
              {(["3m", "6m", "12m"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition-all cursor-pointer ${
                    range === r
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="mt-4 h-64 w-full">
            {isLoading ? (
              <div className="h-full w-full rounded-xl bg-slate-50 flex items-center justify-center animate-pulse">
                <span className="text-xs text-slate-400">Loading trend data...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center">
                <Building2 className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No registration history</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  New societies registered will chart here automatically.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#07584F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#07584F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    labelStyle={{ color: "#94A3B8", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    name="Societies"
                    stroke="#07584F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Footer Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#07584F]" />
              <span>
                <strong className="text-[#0F172A] font-semibold">
                  {totalRegistrationsInRange}
                </strong>{" "}
                societies onboarded in selected range
              </span>
            </span>
            <Link
              href="/admin/apartments"
              className="text-xs font-semibold text-[#07584F] hover:underline inline-flex items-center gap-1"
            >
              <span>Explore communities</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Operational Health & Quick Actions (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Health & Coverage Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Operational Coverage
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Active society verification rate
              </p>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-[#0F172A] tabular-nums">
                  {activeSocieties} / {totalSocieties}
                </span>
                <span className="text-xs font-bold text-[#07584F]">
                  {activeCoveragePercent}% active
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#07584F] to-[#10B981] transition-all duration-500"
                  style={{ width: `${activeCoveragePercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Active Subscriptions</span>
                </span>
                <span className="font-bold text-[#0F172A]">{activeSubscriptions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Pending Invoices</span>
                </span>
                <span className="font-bold text-[#0F172A]">{pendingSubscriptions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Expiring Within 30d</span>
                </span>
                <span className="font-bold text-rose-700">
                  {expiringSoonSubscriptions}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Operations Strip */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Quick Operations
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/apartments"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-[#EAF5EE] hover:border-emerald-200 transition group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Societies</span>
              </Link>

              <Link
                href="/admin/plans"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-[#EAF5EE] hover:border-emerald-200 transition group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Plans</span>
              </Link>

              <Link
                href="/admin/subscriptions"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-[#EAF5EE] hover:border-emerald-200 transition group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Billing</span>
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-[#EAF5EE] hover:border-emerald-200 transition group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Users</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. RECENT ACTIVITY DUAL STREAMS (Real Data)                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Recent Onboarded Societies */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Recent Societies
                </h3>
                <p className="text-xs text-[#64748B]">
                  Latest apartment communities added to Nesteeq
                </p>
              </div>
              <Link
                href="/admin/apartments"
                className="text-xs font-semibold text-[#07584F] hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* List */}
            <div className="mt-3 divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-32 bg-slate-100 rounded" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))
              ) : recentApartments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Building2 className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No societies registered</p>
                  <p className="mt-0.5">Societies added to the system will appear here.</p>
                </div>
              ) : (
                recentApartments.map((apt) => {
                  const initials = getInitials(apt.name)
                  const isActive = apt.status === "active"
                  return (
                    <div
                      key={apt._id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] border border-emerald-200/80 text-xs font-bold text-[#07584F] shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                            {apt.name}
                          </p>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {apt.city || "Urban Region"}
                            {apt.totalUnits ? ` · ${apt.totalUnits} units` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            isActive
                              ? "bg-[#EAF5EE] text-[#07584F] border-emerald-200/80"
                              : "bg-[#FFFBEB] text-[#B45309] border-amber-200/80"
                          }`}
                        >
                          {isActive ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link
              href="/admin/apartments"
              className="text-xs font-semibold text-[#07584F] hover:underline"
            >
              Manage all societies ({totalSocieties}) →
            </Link>
          </div>
        </div>

        {/* Right: Recent Transactions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Recent Transactions
                </h3>
                <p className="text-xs text-[#64748B]">
                  Live subscription payment activity
                </p>
              </div>
              <Link
                href="/admin/payments"
                className="text-xs font-semibold text-[#07584F] hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* List */}
            <div className="mt-3 divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-32 bg-slate-100 rounded" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))
              ) : recentPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CreditCard className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No payment records</p>
                  <p className="mt-0.5">Subscription payments will stream here in real-time.</p>
                </div>
              ) : (
                recentPayments.map((payment) => {
                  const aptName = payment.apartment?.name || "Apartment"
                  const isCaptured = payment.status === "captured"
                  return (
                    <div
                      key={payment._id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 shrink-0 shadow-2xs group-hover:bg-[#EAF5EE] group-hover:text-[#07584F] transition-colors">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                            {aptName}
                          </p>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {payment.planName} · {formatDate(payment.paidAt || payment.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#0F172A] tabular-nums">
                          {formatINR(payment.totalAmount || payment.amount)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-semibold border ${
                            isCaptured
                              ? "bg-[#EAF5EE] text-[#07584F] border-emerald-200/80"
                              : "bg-[#FEF2F2] text-[#DC2626] border-red-200/80"
                          }`}
                        >
                          {isCaptured ? "Captured" : payment.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-[#07584F] hover:underline"
            >
              All payment records →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
