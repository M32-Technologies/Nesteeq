"use client"

import { useMemo } from "react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { DeliveryRecord, DeliveryStats } from "../types/deliveries"

interface DeliveryInsightsCardProps {
  stats?: DeliveryStats
  deliveries?: DeliveryRecord[]
  isLoading?: boolean
}

// Unified color palette matching Deliveries Overview (Green = Delivered, Blue = Pending, Rose = Returned)
const colors = {
  delivered: "#10B981", // Emerald green
  pending: "#60A5FA",   // Vibrant sky blue
  returned: "#F87171",  // Coral rose
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      color: string
    }
  }>
}

function CustomDonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  if (!item || item.name === "Empty") return null

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/95 px-3 py-1.5 text-xs shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: item.payload?.color || colors.delivered }}
        />
        <span className="font-semibold text-white">{item.name}</span>
        <span className="font-bold text-white tabular-nums">{item.value}</span>
      </div>
    </div>
  )
}

export default function DeliveryInsightsCard({
  stats,
  deliveries = [],
  isLoading = false,
}: DeliveryInsightsCardProps) {
  // Aggregate real statistics
  const delivered =
    stats?.collected ??
    deliveries.filter((d) => d.status === "COLLECTED").length

  const pending =
    (stats?.waiting ??
      deliveries.filter((d) => d.status === "WAITING").length) +
    (stats?.notified ??
      deliveries.filter((d) => d.status === "NOTIFIED").length)

  const returned =
    stats?.returned ??
    deliveries.filter((d) => d.status === "RETURNED").length

  const total = stats?.total ?? delivered + pending + returned

  const deliveredPct = total > 0 ? Math.round((delivered / total) * 100) : 0
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0
  const returnedPct = total > 0 ? Math.round((returned / total) * 100) : 0

  // Donut data for Recharts Pie
  const donutData = useMemo(() => {
    if (total === 0) {
      return [{ name: "Empty", value: 1, color: "#F1F5F9" }]
    }
    const data = [
      { name: "Delivered", value: delivered, color: colors.delivered },
      { name: "Pending", value: pending, color: colors.pending },
      { name: "Returned", value: returned, color: colors.returned },
    ]
    return data.filter((d) => d.value > 0)
  }, [total, delivered, pending, returned])

  return (
    <div className="flex h-[300px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Header matching user's screenshot */}
      <div className="pb-1">
        <h3 className="text-base font-bold tracking-tight text-slate-900">
          Delivery Status
        </h3>
      </div>

      {/* Main Body: Donut chart on left, Metrics list on right */}
      <div className="flex flex-1 items-center justify-between gap-4 py-1">
        {/* Donut Chart with Centered Total Number (enlarged & prominent) */}
        <div className="relative size-[195px] shrink-0 outline-none select-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-layer]:outline-none [&_svg]:outline-none">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="size-36 animate-pulse rounded-full bg-slate-100" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={total > 0 && donutData.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Total centered inside the donut ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">
                  {total}
                </span>
                <span className="text-xs font-semibold text-slate-400 mt-1">
                  Total
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend / Metrics List on the Right matching user's screenshot */}
        <div className="flex-1 space-y-4 pr-1">
          {/* Delivered Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: colors.delivered }}
              />
              <span className="font-semibold text-slate-700 text-sm">Delivered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {isLoading ? "—" : delivered}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({isLoading ? "—" : `${deliveredPct}%`})
              </span>
            </div>
          </div>

          {/* Pending Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: colors.pending }}
              />
              <span className="font-semibold text-slate-700 text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {isLoading ? "—" : pending}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({isLoading ? "—" : `${pendingPct}%`})
              </span>
            </div>
          </div>

          {/* Returned Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: colors.returned }}
              />
              <span className="font-semibold text-slate-700 text-sm">Returned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {isLoading ? "—" : returned}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({isLoading ? "—" : `${returnedPct}%`})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
