"use client"

import * as React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Calendar, Check, ChevronDown } from "lucide-react"
import type {
  DeliveryActivityItem,
  DeliveryAnalyticsRange,
} from "../types/deliveries"

export interface DeliveryActivityChartProps {
  activity?: DeliveryActivityItem[]
  range: DeliveryAnalyticsRange
  onRangeChange: (range: DeliveryAnalyticsRange) => void
  isLoading?: boolean
}

const rangeLabels: Record<DeliveryAnalyticsRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  thisMonth: "This Month",
  lastMonth: "Last Month",
}

// Unified color palette matching Delivery Status (Green = Delivered, Blue = Pending, Rose = Returned)
const colors = {
  delivered: "#10B981", // Emerald green (Delivered / Collected)
  pending: "#60A5FA",   // Vibrant sky blue (Pending / Waiting / Notified)
  returned: "#F87171",  // Coral rose (Returned)
}

// Clean single-line date formatter (never overlaps)
function formatDateLabel(dateStr: string, is7DayView: boolean): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(Date.UTC(year, month - 1, day))

    if (is7DayView) {
      // "Fri 11", "Thu 17"
      const weekday = d.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      })
      return `${weekday} ${day}`
    }
    // "Aug 19", "Sep 17"
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return dateStr
  }
}

// Full date for tooltip
function formatFullDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(Date.UTC(year, month - 1, day))
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return dateStr
  }
}

// Floating Tooltip for stacked bars
interface TooltipPayloadItem {
  dataKey: string
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomStackedTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm min-w-[140px]">
      <div className="mb-2 border-b border-slate-800 pb-1 text-[11px] font-semibold text-slate-400">
        {label}
      </div>
      <div className="space-y-1.5 text-xs">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300 font-medium capitalize">
                {item.name}
              </span>
            </div>
            <span className="font-bold text-white tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DeliveryActivityChart({
  activity = [],
  range,
  onRangeChange,
  isLoading = false,
}: DeliveryActivityChartProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const is7Day = range === "7d"

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  // Process data into stacked segments: Delivered, Pending, Returned
  const chartData = useMemo(() => {
    return activity.map((item) => {
      const displayLabel = formatDateLabel(item.date, is7Day)
      const fullDate = formatFullDate(item.date)
      const delivered = item.collected || 0
      const returned = item.returned || 0
      const pending = Math.max(0, (item.received || 0) - delivered - returned)

      return {
        ...item,
        displayLabel,
        fullDate,
        delivered,
        pending,
        returned,
        totalDay: delivered + pending + returned,
      }
    })
  }, [activity, is7Day])

  // Calculate clean, unclipped Y-Axis domain & step ticks
  const { domain, ticks } = useMemo(() => {
    const maxDayTotal = Math.max(
      ...chartData.map((d) => d.totalDay),
      0
    )

    if (maxDayTotal <= 3) {
      return { domain: [0, 4], ticks: [0, 1, 2, 3, 4] }
    }
    if (maxDayTotal <= 5) {
      return { domain: [0, 6], ticks: [0, 2, 4, 6] }
    }
    if (maxDayTotal <= 10) {
      return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
    }

    const max = Math.ceil(maxDayTotal / 10) * 10
    const step = max / 4
    return {
      domain: [0, max],
      ticks: [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), max],
    }
  }, [chartData])

  // Responsive bar width: wider for 7 days, sleeker for 30 days
  const barSize = is7Day ? 32 : 14

  // Adaptive tick interval: show every day for 7d; show every 5th day for 30d (no crowding)
  const tickInterval = is7Day ? 0 : 4

  return (
    <div className="flex h-[300px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Header matching user's reference screenshot */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Deliveries Overview
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Incoming and outgoing deliveries for the {rangeLabels[range].toLowerCase()}.
          </p>
        </div>

        {/* Legend + Range selector */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Legend dots */}
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colors.delivered }}
              />
              <span>Delivered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colors.pending }}
              />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colors.returned }}
              />
              <span>Returned</span>
            </div>
          </div>

          {/* Compact range dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              aria-label="Select range"
            >
              <Calendar size={12} className="text-slate-400" />
              <span>{rangeLabels[range]}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in-50 zoom-in-95">
                {(["7d", "30d", "thisMonth", "lastMonth"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onRangeChange(r)
                      setDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                      range === r
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{rangeLabels[r]}</span>
                    {range === r && <Check size={12} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart Area (height 205px for perfect 300px card balance) */}
      <div className="h-[205px] w-full pt-1 outline-none select-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-layer]:outline-none [&_svg]:outline-none">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
              barGap={0}
            >
              {/* Clean dashed horizontal grid lines */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="displayLabel"
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                tickMargin={8}
                interval={tickInterval}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                domain={domain}
                ticks={ticks}
                allowDecimals={false}
                width={26}
              />

              <Tooltip
                content={<CustomStackedTooltip />}
                cursor={{ fill: "rgba(241, 245, 249, 0.75)", rx: 4 }}
              />

              {/* Delivered: Bottom dark blue stack */}
              <Bar
                dataKey="delivered"
                name="Delivered"
                stackId="deliveriesStack"
                fill={colors.delivered}
                radius={[3, 3, 0, 0]}
                maxBarSize={barSize}
              />

              {/* Pending: Middle sky blue stack */}
              <Bar
                dataKey="pending"
                name="Pending"
                stackId="deliveriesStack"
                fill={colors.pending}
                radius={[3, 3, 0, 0]}
                maxBarSize={barSize}
              />

              {/* Returned: Top soft pink stack */}
              <Bar
                dataKey="returned"
                name="Returned"
                stackId="deliveriesStack"
                fill={colors.returned}
                radius={[3, 3, 0, 0]}
                maxBarSize={barSize}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
