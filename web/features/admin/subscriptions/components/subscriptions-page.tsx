"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import SubscriptionKpiCards from "./subscription-kpi-cards"
import SubscriptionGrowthChart from "./subscription-growth-chart"
import SubscriptionsTable from "./subscriptions-table"
import { fetchSubscriptionStats } from "../api/subscription.api"
import type { SubscriptionStats } from "../types"

export default function SubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchSubscriptionStats()
      setStats(data)
    } catch {
      setError("Unable to load subscription statistics from the server.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="w-full space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Subscription Sync Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 1. Subscription Metric KPI Cards */}
      <SubscriptionKpiCards stats={stats} isLoading={isLoading} />

      {/* 2. New Subscriptions Growth Chart */}
      <SubscriptionGrowthChart />

      {/* 3. Search + Filters + Subscriptions Table + Pagination */}
      <SubscriptionsTable />
    </div>
  )
}
