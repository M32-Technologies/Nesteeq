"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Radio, AlertCircle } from "lucide-react"
import PaymentKpiCards from "./payment-kpi-cards"
import { fetchRevenueStats } from "../api/payment.api"
import type { RevenueStats } from "../types"

export default function PaymentsPage() {
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

      {/* 1. Financial & Payment KPI Metrics (Live Connected) */}
      <PaymentKpiCards stats={stats} isLoading={isLoading} />

      {/* 2. Global Payments Ledger Area */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#07584F] shadow-2xs">
          <CreditCard className="h-7 w-7" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Global Payments Ledger
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
            <Radio className="h-2 w-2 text-emerald-600 animate-pulse" />
            Live Sync
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
          Real-time transaction records, invoice receipts, and auto-debit renewals synchronized directly via Razorpay Subscriptions.
        </p>
      </div>
    </div>
  )
}
