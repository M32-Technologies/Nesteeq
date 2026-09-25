"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Building2, ChevronRight, TrendingUp, AlertCircle, RefreshCw } from "lucide-react"
import { fetchTopRevenueSocieties } from "../api/payment.api"
import type { TopSocietyRevenueItem } from "../types"
import { cn } from "@/lib/utils"

const AVATAR_PALETTE = [
  { bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { bg: "bg-teal-100 text-teal-800 border-teal-200" },
  { bg: "bg-sky-100 text-sky-800 border-sky-200" },
  { bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { bg: "bg-amber-100 text-amber-800 border-amber-200" },
  { bg: "bg-rose-100 text-rose-800 border-rose-200" },
  { bg: "bg-purple-100 text-purple-800 border-purple-200" },
]

function getSocietyInitials(name: string): string {
  if (!name) return "AP"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getSocietyColor(name: string): { bg: string } {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return {
      classes: "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs",
      label: "1",
    }
  }
  if (rank === 2) {
    return {
      classes: "bg-slate-200 text-slate-800 border-slate-300",
      label: "2",
    }
  }
  if (rank === 3) {
    return {
      classes: "bg-orange-100 text-orange-900 border-orange-300",
      label: "3",
    }
  }
  return {
    classes: "bg-slate-100 text-slate-600 border-slate-200",
    label: String(rank),
  }
}

export function TopApartmentsRanking() {
  const [societies, setSocieties] = useState<TopSocietyRevenueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<number>(5)

  const loadTopSocieties = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchTopRevenueSocieties(limit)
      setSocieties(data)
    } catch {
      setError("Unable to load top performing apartments.")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadTopSocieties()
  }, [loadTopSocieties])

  const maxRevenue = useMemo(() => {
    if (!societies.length) return 1
    return Math.max(...societies.map((s) => s.totalRevenue), 1)
  }, [societies])

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Top Apartments by Revenue
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="h-3 w-3" />
              Rankings
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Top performing apartments based on subscription payments
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs transition hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
          </select>

          <button
            type="button"
            onClick={loadTopSocieties}
            disabled={isLoading}
            title="Refresh rankings"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted/60" />
                <div className="h-9 w-9 rounded-full bg-muted/60" />
                <div className="w-48 space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-muted/60" />
                  <div className="h-2.5 w-24 rounded bg-muted/40" />
                </div>
                <div className="flex-1 hidden md:block">
                  <div className="h-3 rounded-full bg-muted/40" />
                </div>
                <div className="w-24 text-right space-y-1">
                  <div className="h-3.5 w-16 ml-auto rounded bg-muted/60" />
                  <div className="h-2.5 w-20 ml-auto rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-between rounded-xl bg-red-50/70 p-4 text-xs text-red-700 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadTopSocieties}
              className="font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : societies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">No Society Revenue Records</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Captured subscription payments will automatically rank societies here.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {societies.map((society, idx) => {
              const rank = idx + 1
              const rankBadge = getRankBadge(rank)
              const initials = getSocietyInitials(society.name)
              const avatarStyle = getSocietyColor(society.name)
              const percentage = Math.max(
                Math.round((society.totalRevenue / maxRevenue) * 100),
                8
              )

              return (
                <div
                  key={society.apartmentId}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  {/* Left: Rank & Society Info */}
                  <div className="flex items-center gap-3 min-w-[220px] max-w-xs shrink-0">
                    {/* Rank Circle */}
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border shrink-0",
                        rankBadge.classes
                      )}
                    >
                      {rankBadge.label}
                    </span>

                    {/* Initials Avatar */}
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border shrink-0 shadow-2xs",
                        avatarStyle.bg
                      )}
                    >
                      {initials}
                    </div>

                    {/* Names */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-700 transition-colors">
                        {society.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {society.city || "Society"}
                        {society.state ? `, ${society.state}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Horizontal Progress Bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500 transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Revenue & Transactions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-44 shrink-0 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatINR(society.totalRevenue)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60 shrink-0">
                      {society.transactionCount}{" "}
                      {society.transactionCount === 1 ? "tx" : "txs"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopApartmentsRanking
