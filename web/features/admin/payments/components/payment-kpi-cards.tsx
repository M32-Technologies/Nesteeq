"use client"

import {
  Wallet,
  CalendarDays,
  Building2,
  Receipt,
  Radio,
  CheckCircle2,
} from "lucide-react"
import type { RevenueStats } from "../types"

type PaymentKpiCardsProps = {
  stats?: RevenueStats | null
  isLoading?: boolean
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PaymentKpiCards({
  stats,
  isLoading = false,
}: PaymentKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[120px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
            </div>
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100/80">
              <div className="h-3 w-28 rounded bg-slate-50 animate-pulse" />
              <div className="h-4 w-12 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Live KPI values from backend
  const totalRev = stats?.totalRevenue ?? 0
  const monthlyRev = stats?.revenueThisMonth ?? 0
  const activeSubs = stats?.activeSubscribers ?? 0
  const totalTx = stats?.totalTransactions ?? 0

  const cards = [
    {
      label: "Total Revenue",
      value: formatINR(totalRev),
      subtitle: `${totalTx.toLocaleString()} transactions recorded`,
      icon: Wallet,
      iconBg: "bg-[#EAF5EE]",
      iconColor: "text-[#07584F]",
      badgeText: "All-time",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      badgeIcon: Radio,
    },
    {
      label: "Monthly Revenue",
      value: formatINR(monthlyRev),
      subtitle: "Current calendar month",
      icon: CalendarDays,
      iconBg: "bg-[#F0FDFA]",
      iconColor: "text-[#0D9488]",
      badgeText: "This month",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
    },
    {
      label: "Active Subscriptions",
      value: activeSubs.toLocaleString(),
      subtitle: "Societies on active billing",
      icon: Building2,
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#2563EB]",
      badgeText: "Active",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Total Transactions",
      value: totalTx.toLocaleString(),
      subtitle: "Captured payment receipts",
      icon: Receipt,
      iconBg: "bg-[#ECFDF5]",
      iconColor: "text-[#059669]",
      badgeText: "Captured",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      badgeIcon: CheckCircle2,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const BadgeIcon = card.badgeIcon
        return (
          <div
            key={card.label}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          >
            {/* Top row: Label & Value on left, Icon on right */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#64748B] block truncate">
                  {card.label}
                </span>
                <span className="mt-1 block text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A] tabular-nums truncate">
                  {card.value}
                </span>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-200 group-hover:scale-105 shadow-2xs`}
              >
                <Icon className="h-4.5 w-4.5 stroke-[1.8]" />
              </div>
            </div>

            {/* Bottom row: Subtitle on left, Badge on right */}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100/90 pt-2.5 text-[11px] text-[#64748B]">
              <span className="truncate">{card.subtitle}</span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${card.badgeColor}`}
              >
                {BadgeIcon && (
                  <BadgeIcon className="h-2.5 w-2.5 stroke-[2.2]" />
                )}
                <span>{card.badgeText}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
