"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { ChevronDown, AlertCircle, RefreshCw } from "lucide-react"
import { fetchBillingBreakdown } from "../api/payment.api"
import type { BillingBreakdownData } from "../types"
import { formatINR } from "./payment-kpi-cards"

// Curated harmonious palette for dynamic plan assignments
const PALETTE = [
  "#07584F", // Dark forest emerald (Primary)
  "#10B981", // Vibrant emerald
  "#0D9488", // Deep teal
  "#0284C7", // Sky blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Rose
  "#F59E0B", // Amber
  "#14B8A6", // Cyan teal
  "#34D399", // Light emerald
]

// Deterministic color assignment: maps known plan intervals to signature hues,
// and dynamically assigns rich palette colors to any new custom plan added by the admin
function getDeterministicPlanColor(name: string, fallbackIndex: number): string {
  const lower = name.toLowerCase().trim()
  if (lower.includes("year") || lower.includes("annual")) {
    return "#07584F" // Dark forest emerald
  }
  if (lower.includes("6 month") || lower.includes("half") || lower.includes("semi")) {
    return "#0D9488" // Deep Teal
  }
  if (lower.includes("month") && !lower.includes("6")) {
    return "#10B981" // Vibrant Emerald
  }
  if (lower.includes("quarter")) {
    return "#0284C7" // Sky blue
  }
  if (lower.includes("enterprise")) {
    return "#6366F1" // Indigo
  }
  if (lower.includes("custom")) {
    return "#8B5CF6" // Purple
  }
  // Dynamic fallback for any newly added plan
  return PALETTE[fallbackIndex % PALETTE.length]
}

type TimeframeOption = "this_month" | "last_6_months" | "all_time"

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  this_month: "This month",
  last_6_months: "Last 6 months",
  all_time: "All-time",
}

export function RevenueDistributionChart() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("this_month")
  const [breakdown, setBreakdown] = useState<BillingBreakdownData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchBillingBreakdown()
      setBreakdown(data)
    } catch {
      setError("Unable to load revenue distribution.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Dynamically uses all plans registered in the system (Monthly, 6 Months, Yearly, or any new plan)
  const plans = breakdown?.plans ?? []
  const totalRevenue = useMemo(
    () => plans.reduce((acc, p) => acc + (p.revenue || 0), 0),
    [plans]
  )

  // 1. Sort plans deterministically so ordering is 100% stable across refreshes
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      // Primary: sort by revenue descending
      const revDiff = (b.revenue || 0) - (a.revenue || 0)
      if (revDiff !== 0) return revDiff
      // Secondary: sort by active societies count descending
      const countDiff = (b.count || 0) - (a.count || 0)
      if (countDiff !== 0) return countDiff
      // Tertiary: alphabetical by name
      return a.planName.localeCompare(b.planName)
    })
  }, [plans])

  // 2. Map deterministic colors and calculate revenue percentages
  const chartData = useMemo(() => {
    return sortedPlans.map((plan, index) => {
      const color = getDeterministicPlanColor(plan.planName, index)
      const revenue = plan.revenue || 0
      const count = plan.count || 0

      // Revenue distribution percentage: relative to total revenue when > 0
      const percentage =
        totalRevenue > 0
          ? (revenue / totalRevenue) * 100
          : plan.percentage > 0
          ? plan.percentage
          : 0

      return {
        name: plan.planName,
        value: totalRevenue > 0 ? revenue : count > 0 ? count : 0,
        revenue,
        count,
        percentage,
        color,
      }
    })
  }, [sortedPlans, totalRevenue])

  // Only render non-zero slices in the pie chart
  const pieSlices = useMemo(() => {
    const active = chartData.filter((d) => d.value > 0)
    if (active.length > 0) return active
    return [
      {
        name: "No Revenue Recorded",
        value: 1,
        revenue: 0,
        count: 0,
        percentage: 0,
        color: "#E2E8F0",
      },
    ]
  }, [chartData])

  const hasValues = chartData.some((d) => d.value > 0)

  // Hover state resolution
  const isHovered =
    hoveredIndex !== null && chartData[hoveredIndex] !== undefined
  const activeItem = isHovered ? chartData[hoveredIndex!] : null

  const centerValue = isHovered
    ? formatINR(activeItem!.revenue)
    : formatINR(totalRevenue)
  const centerLabel = isHovered ? activeItem!.name : "Total Revenue"
  const centerColor = isHovered ? activeItem!.color : undefined

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Revenue Distribution
          </h3>
          <p className="mt-0.5 text-xs text-[#64748B]">
            By subscription plan type
          </p>
        </div>

        {/* Timeframe Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <span>{TIMEFRAME_LABELS[timeframe]}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#64748B] transition-transform duration-150 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 w-36 rounded-xl border border-slate-200/90 bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-100">
              {(Object.keys(TIMEFRAME_LABELS) as TimeframeOption[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTimeframe(key)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    timeframe === key
                      ? "bg-emerald-50 text-[#07584F] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {TIMEFRAME_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-4 flex-1 flex flex-col justify-center">
        {error ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : !isMounted || isLoading ? (
          <div className="flex h-56 items-center justify-center gap-6 p-4 animate-pulse">
            <div className="h-44 w-44 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/6 rounded bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* Donut Chart: 200px size, innerRadius 65, dynamic PieCenter */}
            <div className="relative h-[200px] w-[200px] shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={() => null} />
                  <Pie
                    data={pieSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={hasValues && pieSlices.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => {
                      if (!hasValues) return
                      const sliceName = pieSlices[index]?.name
                      const originalIdx = chartData.findIndex((c) => c.name === sliceName)
                      if (originalIdx !== -1) setHoveredIndex(originalIdx)
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {pieSlices.map((entry, index) => {
                      const isSliceActive =
                        hoveredIndex === null ||
                        chartData[hoveredIndex]?.name === entry.name
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={isSliceActive ? 1 : 0.45}
                          className="transition-all duration-200 cursor-pointer outline-hidden"
                        />
                      )
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic PieCenter: matches requested hover-reactive center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                <div
                  className="font-bold text-xl tracking-tight tabular-nums transition-colors duration-200 truncate max-w-[130px]"
                  style={{ color: isHovered ? centerColor : undefined }}
                >
                  {centerValue}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 font-medium transition-colors duration-200 truncate max-w-[130px]">
                  {centerLabel}
                </div>
                {isHovered && activeItem && activeItem.percentage > 0 && (
                  <div
                    className="text-[10px] font-semibold mt-0.5 transition-colors duration-150"
                    style={{ color: activeItem.color }}
                  >
                    {activeItem.percentage.toFixed(1)}% of revenue
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Legend List synchronized with PieCenter */}
            <div className="flex-1 w-full space-y-2 min-w-[200px]">
              {chartData.map((plan, index) => {
                const isSelected = hoveredIndex === index
                return (
                  <div
                    key={plan.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between gap-3 text-xs p-2 -mx-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-100/80 shadow-2xs"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs transition-transform duration-150"
                        style={{
                          backgroundColor: plan.color,
                          transform: isSelected ? "scale(1.25)" : "scale(1)",
                        }}
                      />
                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs transition-colors ${
                            isSelected
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {plan.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {plan.count} {plan.count === 1 ? "society" : "societies"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#0F172A] tabular-nums text-xs">
                        {formatINR(plan.revenue)}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 tabular-nums">
                        {plan.percentage > 0
                          ? `${plan.percentage.toFixed(1)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RevenueDistributionChart
