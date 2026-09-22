"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  CreditCard,
  Users,
  BarChart3,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Radio,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<ApartmentStats | null>(null)
  const [recentApartments, setRecentApartments] = useState<ApartmentItem[]>([])
  const [analytics, setAnalytics] = useState<ApartmentAnalyticsData | null>(null)
  const [range, setRange] = useState<"3m" | "6m" | "12m">("6m")
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statsRes, apartmentsRes, analyticsRes] = await Promise.allSettled([
        fetchApartmentStats(),
        fetchApartments({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
        fetchApartmentAnalytics(range),
      ])

      if (statsRes.status === "fulfilled") setStats(statsRes.value)
      if (apartmentsRes.status === "fulfilled")
        setRecentApartments(apartmentsRes.value.apartments || [])
      if (analyticsRes.status === "fulfilled")
        setAnalytics(analyticsRes.value)
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const totalSocieties = stats?.total ?? 0
  const activeSocieties = stats?.active ?? 0
  const pendingSocieties = stats?.pending_payment ?? 0
  const inactiveSocieties = stats?.inactive ?? 0

  const activePercent =
    totalSocieties > 0 ? Math.round((activeSocieties / totalSocieties) * 100) : 0

  // Chart data from analytics API or fallback month structure with real counts
  const chartData =
    analytics?.registrations && analytics.registrations.length > 0
      ? analytics.registrations.map((r) => ({
          month: r.period.length === 7 ? r.period.slice(5) : r.period,
          registrations: r.count,
        }))
      : [
          { month: "Jan", registrations: 0 },
          { month: "Feb", registrations: 0 },
          { month: "Mar", registrations: 0 },
          { month: "Apr", registrations: 0 },
          { month: "May", registrations: 0 },
          { month: "Jun", registrations: 0 },
        ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN (Main Stats & Large Cards - 8 cols)          */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Top Financial / Society Overview Card */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Sub-Section: Main Number & Action Pills */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Total Managed Societies
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                      <Radio className="h-2 w-2 text-emerald-600 animate-pulse" />
                      Live Platform
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                      {isLoading ? (
                        <span className="inline-block h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
                      ) : (
                        totalSocieties
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      <span>Active Tiers</span>
                    </span>
                  </div>

                  <Link
                    href="/admin/apartments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#07584F] hover:underline mt-1.5"
                  >
                    <span>View all societies</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Quick Action Pills (Matching Bank.LY reference action buttons) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href="/admin/apartments"
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 transition-all text-center group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-[#0F172A]">
                      Society
                    </span>
                  </Link>

                  <Link
                    href="/admin/plans"
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 transition-all text-center group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-[#0F172A]">
                      Plans
                    </span>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 transition-all text-center group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-[#0F172A]">
                      Users
                    </span>
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 transition-all text-center group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#07584F] shadow-2xs group-hover:scale-105 transition-transform">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-[#0F172A]">
                      Reports
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right Sub-Section: Sub-KPI Highlights */}
              <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-5 md:pt-0 space-y-4">
                {/* Active Societies sub-card */}
                <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Active Societies
                    </span>
                    <Link
                      href="/admin/apartments?status=active"
                      className="text-[11px] font-semibold text-[#07584F] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[#0F172A]">
                    {isLoading ? (
                      <span className="inline-block h-7 w-16 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      activeSocieties
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified &amp; Operational</span>
                  </p>
                </div>

                {/* Pending Onboarding sub-card */}
                <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Pending Onboarding
                    </span>
                    <Link
                      href="/admin/apartments?status=pending_payment"
                      className="text-[11px] font-semibold text-[#07584F] hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[#0F172A]">
                    {isLoading ? (
                      <span className="inline-block h-7 w-16 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      pendingSocieties
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Awaiting payment or setup</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Platform Growth & Activity Overview Chart (Matching "Spending overview") */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Platform Growth &amp; Registrations
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                    {totalSocieties} Societies
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Growth Trends
                  </span>
                </div>
              </div>

              {/* Range Selector Pill */}
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

            {/* Spline Area Chart */}
            <div className="mt-5 h-64 w-full">
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
                    dataKey="month"
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
            </div>

            {/* Category Sub-Pills Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#07584F]" />
                <span className="font-semibold text-[#0F172A]">Societies Registered</span>
                <span className="text-[#64748B] font-mono text-[11px]">
                  ({chartData.reduce((a, b) => a + b.registrations, 0)} total in range)
                </span>
              </div>

              <div className="flex items-center gap-4 text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Verified Onboarding</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Razorpay Linked</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: System Insights (Matching "Insights" in reference) */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
              Platform Governance &amp; Insights
            </h3>

            <div className="space-y-3">
              <div className="flex items-start justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#07584F] shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">
                      Apartment Verification Status
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      {activeSocieties} of {totalSocieties} societies actively managed with verified credentials.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/apartments"
                  className="text-xs font-semibold text-[#07584F] hover:underline whitespace-nowrap ml-2"
                >
                  View More
                </Link>
              </div>

              <div className="flex items-start justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">
                      Subscription Gateway Integration
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      Razorpay merchant webhooks active for automatic society invoice renewal.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/plans"
                  className="text-xs font-semibold text-[#07584F] hover:underline whitespace-nowrap ml-2"
                >
                  View More
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (Summary Arc, Recent List, Coverage - 4 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Societies Summary Arc Gauge (Matching "Accounts summary" in reference) */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
              Societies Summary
            </h3>

            {/* Semi-Circle SVG Gauge */}
            <div className="relative flex flex-col items-center justify-center pt-2">
              <svg className="w-52 h-28 overflow-visible" viewBox="0 0 200 110">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Inactive segment */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    totalSocieties > 0
                      ? 251.2 * (1 - (inactiveSocieties + pendingSocieties + activeSocieties) / (totalSocieties || 1))
                      : 251.2
                  }
                  strokeLinecap="round"
                />
                {/* Pending segment */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    totalSocieties > 0
                      ? 251.2 * (1 - (pendingSocieties + activeSocieties) / (totalSocieties || 1))
                      : 251.2
                  }
                  strokeLinecap="round"
                />
                {/* Active segment */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#07584F"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    totalSocieties > 0
                      ? 251.2 * (1 - activeSocieties / (totalSocieties || 1))
                      : 251.2
                  }
                  strokeLinecap="round"
                />
              </svg>

              {/* Center stat inside the arc */}
              <div className="absolute top-16 text-center">
                <span className="text-3xl font-extrabold text-[#0F172A]">
                  {totalSocieties}
                </span>
                <p className="text-[11px] text-[#64748B] font-medium">
                  Total Societies
                </p>
              </div>
            </div>

            {/* Summary Legend (Matching reference legend exactly) */}
            <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#07584F]" />
                  <span>Active Societies</span>
                </span>
                <span className="font-bold text-[#0F172A]">{activeSocieties}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                  <span>Pending Payment</span>
                </span>
                <span className="font-bold text-[#0F172A]">{pendingSocieties}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#94A3B8]" />
                  <span>Inactive / Hidden</span>
                </span>
                <span className="font-bold text-[#0F172A]">{inactiveSocieties}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Recent Societies List (Matching "Recent Transactions" in reference) */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Recent Societies
              </h3>
              <Link
                href="/admin/apartments"
                className="text-xs font-semibold text-[#07584F] hover:underline"
              >
                View More
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-2xl animate-pulse"
                  >
                    <div className="h-10 w-10 bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-100 rounded" />
                      <div className="h-2.5 w-20 bg-slate-50 rounded" />
                    </div>
                  </div>
                ))
              ) : recentApartments.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#94A3B8]">
                  <Building2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-[#0F172A]">No societies registered yet</p>
                  <p className="mt-1">Add your first society to see live activity.</p>
                </div>
              ) : (
                recentApartments.map((apt) => (
                  <div
                    key={apt._id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3 overflow-hidden mr-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF5EE] to-[#D5EBE0] text-[#07584F] font-bold text-sm shrink-0 shadow-2xs">
                        {apt.name?.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">
                          {apt.name}
                        </h4>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {apt.city || "Urban Region"} • {apt.totalUnits || 0} units
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        apt.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {apt.status === "active" ? "Active" : "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Active Coverage Widget (Matching "Monthly Budget" in reference) */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Active Platform Coverage
            </span>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {activeSocieties}{" "}
                <span className="text-sm font-normal text-[#64748B]">
                  / {totalSocieties} societies
                </span>
              </div>
              <span className="text-xs font-bold text-[#07584F]">
                {activePercent}% active
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#07584F] to-[#0A7B6E] transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
              <span>Pending Activations:</span>
              <span className="font-bold text-[#0F172A]">{pendingSocieties}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
