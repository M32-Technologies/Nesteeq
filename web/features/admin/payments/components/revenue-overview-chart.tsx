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
import { ChevronDown, AlertCircle, RefreshCw } from "lucide-react"
import { fetchRevenueAnalytics } from "../api/payment.api"
import type { MonthlyRevenue } from "../types"
import { formatINR } from "./payment-kpi-cards"

type RangeOption = "3m" | "6m" | "12m" | "1y"

const RANGE_LABELS: Record<RangeOption, string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  "1y": "Last 1 year",
}

export function formatCompactINR(value: number): string {
  if (!value || value === 0) return "₹0"
  if (value >= 10000000) {
    const cr = value / 10000000
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)}Cr`
  }
  if (value >= 100000) {
    const l = value / 100000
    return `₹${l % 1 === 0 ? l : l.toFixed(1)}L`
  }
  if (value >= 1000) {
    const k = value / 1000
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}K`
  }
  return `₹${Math.round(value)}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: MonthlyRevenue
  }>
  label?: string
}

function RevenueChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]
  const revenue = dataPoint.value ?? 0
  const txCount = dataPoint.payload?.count ?? 0

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#059669] shrink-0" />
        <span className="text-sm font-bold text-[#0F172A] tabular-nums tracking-tight">
          {formatINR(revenue)}
        </span>
      </div>
      {txCount > 0 && (
        <p className="mt-0.5 text-[10px] text-[#94A3B8] font-medium">
          {txCount} {txCount === 1 ? "transaction" : "transactions"}
        </p>
      )}
    </div>
  )
}

export function RevenueOverviewChart() {
  const [range, setRange] = useState<RangeOption>("6m")
  const [data, setData] = useState<MonthlyRevenue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close dropdown on outside click
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

  const loadData = useCallback(async (selectedRange: RangeOption) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchRevenueAnalytics(selectedRange)
      setData(response.revenues ?? [])
    } catch {
      setError("Unable to load revenue analytics.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(range)
  }, [range, loadData])

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Revenue Overview
          </h3>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Monthly revenue from subscription payments
          </p>
        </div>

        {/* Range Selector Dropdown */}
        <div className="relative self-start sm:self-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span>{RANGE_LABELS[range]}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#64748B] transition-transform duration-150 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 w-40 rounded-xl border border-slate-200/90 bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-100">
              {(Object.keys(RANGE_LABELS) as RangeOption[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRange(key)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    range === key
                      ? "bg-emerald-50 text-[#07584F] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {RANGE_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-6 flex-1 flex flex-col justify-center">
        {error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={() => loadData(range)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : !isMounted || isLoading ? (
          <div className="flex h-64 w-full flex-col justify-end gap-3 rounded-xl bg-slate-50/50 p-6 animate-pulse">
            <div className="h-3 w-20 rounded bg-slate-200/80 mb-auto" />
            <div className="h-32 w-full rounded-lg bg-slate-200/50" />
            <div className="flex justify-between pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-2.5 w-12 rounded bg-slate-200/70" />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 18, right: 16, left: 4, bottom: 4 }}
              >
                <defs>
                  {/* Emerald gradient fill matching the reference design */}
                  <linearGradient
                    id="revenueOverviewGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#059669"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="#059669"
                      stopOpacity={0.0}
                    />
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
                  dy={10}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={formatCompactINR}
                  domain={[0, "auto"]}
                  dx={-4}
                  allowDecimals={false}
                />

                <Tooltip
                  content={<RevenueChartTooltip />}
                  cursor={{
                    stroke: "#059669",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 4",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueOverviewGradient)"
                  dot={{
                    r: 3.5,
                    fill: "#059669",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#047857",
                    stroke: "#FFFFFF",
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default RevenueOverviewChart
