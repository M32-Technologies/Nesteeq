"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { ChevronDown, AlertCircle, RefreshCw, Layers } from "lucide-react"
import { fetchSubscriptionAnalytics } from "../api/subscription.api"
import type { MonthlySubscription } from "../types"

type RangeOption = "3m" | "6m" | "12m"

const RANGE_LABELS: Record<RangeOption, string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: MonthlySubscription
  }>
  label?: string
}

function SubscriptionChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]
  const count = dataPoint.value ?? 0

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#07584F] shrink-0" />
        <span className="text-sm font-bold text-[#0F172A] tabular-nums tracking-tight">
          {count} {count === 1 ? "subscription" : "subscriptions"}
        </span>
      </div>
    </div>
  )
}

export default function SubscriptionGrowthChart() {
  const [range, setRange] = useState<RangeOption>("6m")
  const [data, setData] = useState<MonthlySubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
      const res = await fetchSubscriptionAnalytics(range)
      setData(res.subscriptions || [])
    } catch {
      setError("Unable to load subscription growth analytics.")
    } finally {
      setIsLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalPeriodSubscriptions = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              New Subscriptions
            </h3>
            <span className="inline-flex items-center rounded-md bg-[#EAF5EE] px-2 py-0.5 text-[10px] font-semibold text-[#07584F]">
              Growth
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Number of new subscriptions created each month
          </p>
        </div>

        {/* Range Selector Dropdown */}
        <div className="relative self-start sm:self-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{RANGE_LABELS[range]}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-150 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
              {(["3m", "6m", "12m"] as RangeOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setRange(opt)
                    setIsDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors ${
                    range === opt
                      ? "bg-[#EAF5EE] text-[#07584F] font-semibold"
                      : "text-[#334155] hover:bg-slate-50"
                  }`}
                >
                  <span>{RANGE_LABELS[opt]}</span>
                  {range === opt && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#07584F]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary metric banner */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-[#0F172A] tabular-nums">
          {totalPeriodSubscriptions.toLocaleString()}
        </span>
        <span className="text-xs text-[#64748B]">
          total created in {RANGE_LABELS[range].toLowerCase()}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-4 h-64 w-full">
        {isLoading ? (
          <div className="flex h-full w-full flex-col justify-end gap-3 pb-4">
            <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="flex justify-between px-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-3 w-8 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#07584F] hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <Layers className="h-8 w-8 text-slate-300 stroke-1" />
            <p className="mt-2 text-xs font-medium text-[#64748B]">
              No subscription history in this range
            </p>
          </div>
        ) : isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="subGrowthGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<SubscriptionChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#07584F"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#subGrowthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  )
}
