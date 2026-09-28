"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { AlertCircle, RefreshCw, Layers } from "lucide-react"
import { fetchSubscriptionPlanDistribution } from "../api/subscription.api"
import type { SubscriptionPlanDistributionData } from "../types"

// Harmonious palette matching Nesteeq Admin Portal
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

function getDeterministicPlanColor(name: string, fallbackIndex: number): string {
  const lower = name.toLowerCase().trim()
  if (lower.includes("year") || lower.includes("annual")) {
    return "#07584F"
  }
  if (lower.includes("6 month") || lower.includes("half") || lower.includes("semi")) {
    return "#0D9488"
  }
  if (lower.includes("month") && !lower.includes("6")) {
    return "#10B981"
  }
  if (lower.includes("quarter")) {
    return "#0284C7"
  }
  if (lower.includes("enterprise")) {
    return "#6366F1"
  }
  if (lower.includes("custom")) {
    return "#8B5CF6"
  }
  return PALETTE[fallbackIndex % PALETTE.length]
}

export function SubscriptionPlanDistributionChart() {
  const [data, setData] = useState<SubscriptionPlanDistributionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchSubscriptionPlanDistribution()
      setData(result)
    } catch {
      setError("Unable to load plan distribution.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const plans = data?.plans ?? []
  const totalSubscriptions = data?.total ?? 0

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const countDiff = (b.count || 0) - (a.count || 0)
      if (countDiff !== 0) return countDiff
      return a.planName.localeCompare(b.planName)
    })
  }, [plans])

  const chartData = useMemo(() => {
    return sortedPlans.map((plan, index) => {
      const color = getDeterministicPlanColor(plan.planName, index)
      const count = plan.count || 0
      const percentage =
        totalSubscriptions > 0
          ? (count / totalSubscriptions) * 100
          : plan.percentage > 0
          ? plan.percentage
          : 0

      return {
        name: plan.planName,
        value: count,
        count,
        percentage,
        color,
      }
    })
  }, [sortedPlans, totalSubscriptions])

  const pieSlices = useMemo(() => {
    const active = chartData.filter((d) => d.value > 0)
    if (active.length > 0) return active
    return [
      {
        name: "No Subscriptions",
        value: 1,
        count: 0,
        percentage: 0,
        color: "#E2E8F0",
      },
    ]
  }, [chartData])

  const hasValues = chartData.some((d) => d.value > 0)

  const isHovered =
    hoveredIndex !== null && chartData[hoveredIndex] !== undefined
  const activeItem = isHovered ? chartData[hoveredIndex!] : null

  const centerValue = isHovered
    ? `${activeItem!.count}`
    : `${totalSubscriptions}`
  const centerLabel = isHovered ? activeItem!.name : "Total Active"
  const centerColor = isHovered ? activeItem!.color : undefined

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            By Plan Type
          </h3>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Plan distribution
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Layers className="h-3.5 w-3.5 text-[#07584F]" />
          <span>{plans.length} {plans.length === 1 ? "Plan" : "Plans"}</span>
        </span>
      </div>

      {/* Main Content */}
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
        ) : plans.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50/50 p-6 text-center">
            <Layers className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No plan distribution data</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No active subscription records found across plans.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* Donut Chart: 200px size, innerRadius 65, dynamic Center */}
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

              {/* Dynamic Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                <div
                  className="font-bold text-xl tracking-tight tabular-nums transition-colors duration-200 truncate max-w-[130px] text-[#0F172A]"
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
                    {activeItem.percentage.toFixed(1)}% of total
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Legend List */}
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
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#0F172A] tabular-nums text-xs">
                        {plan.count} {plan.count === 1 ? "subscription" : "subscriptions"}
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

export default SubscriptionPlanDistributionChart
