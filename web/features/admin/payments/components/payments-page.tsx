"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle } from "lucide-react"
import PaymentKpiCards from "./payment-kpi-cards"
import RevenueOverviewChart from "./revenue-overview-chart"
import RevenueDistributionChart from "./revenue-distribution-chart"
import PaymentTransactionsTable from "./payment-transactions-table"
import { fetchRevenueStats } from "../api/payment.api"
import type { RevenueStats } from "../types"

export function PaymentsPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchRevenueStats()
      setStats(data)
    } catch {
      setError("Unable to load revenue statistics from the server.")
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
            <p className="font-semibold">Revenue Sync Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 1. Financial & Payment KPI Metric Cards */}
      <PaymentKpiCards stats={stats} isLoading={isLoading} />

      {/* 2. Revenue Graphs Section: Revenue Overview (Area Chart) & Revenue Distribution (Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
          <RevenueOverviewChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-5">
          <RevenueDistributionChart />
        </div>
      </div>

      {/* 3. Payment Transactions History Table with Date Range & Filters */}
      <PaymentTransactionsTable />
    </div>
  )
}

export default PaymentsPage
