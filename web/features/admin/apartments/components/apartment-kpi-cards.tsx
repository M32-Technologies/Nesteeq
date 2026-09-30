"use client"

import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react"
import type { ApartmentStats } from "../types"

type ApartmentKpiCardsProps = {
  stats: ApartmentStats | null
  isLoading?: boolean
}

export default function ApartmentKpiCards({
  stats,
  isLoading = false,
}: ApartmentKpiCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-16 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Total Apartments",
      value: stats.total,
      subtitle: "All registered communities",
      icon: Building2,
      iconBg: "bg-[#EAF5EE]",
      iconColor: "text-[#07584F]",
      subtitleColor: "text-[#059669]",
      subtitlePrefix: "↗",
    },
    {
      label: "Active",
      value: stats.active,
      subtitle: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total apartments`,
      icon: CheckCircle2,
      iconBg: "bg-[#E6F4F1]",
      iconColor: "text-[#0F766E]",
      subtitleColor: "text-[#0F766E]",
      subtitlePrefix: "✓",
    },
    {
      label: "Pending Payment",
      value: stats.pending_payment,
      subtitle:
        stats.pending_payment > 0
          ? "Awaiting first subscription payment"
          : "No pending registrations",
      icon: Clock,
      iconBg: "bg-[#FFF7ED]",
      iconColor: "text-[#C2410C]",
      subtitleColor: stats.pending_payment > 0 ? "text-[#C2410C]" : "text-emerald-600",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      subtitle:
        stats.inactive > 0
          ? "Subscription expired or deactivated"
          : "All communities active",
      icon: XCircle,
      iconBg: "bg-[#FEF2F2]",
      iconColor: "text-[#DC2626]",
      subtitleColor: stats.inactive > 0 ? "text-[#DC2626]" : "text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="group relative flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon className="h-6 w-6 stroke-[1.8]" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-[#64748B] block">
                {card.label}
              </span>
              <div className="mt-0.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p
                className={`mt-1 text-xs font-medium ${card.subtitleColor} flex items-center gap-1 truncate`}
              >
                {card.subtitlePrefix && <span>{card.subtitlePrefix}</span>}
                <span>{card.subtitle}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
