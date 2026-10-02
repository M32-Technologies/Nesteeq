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
            className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-14 rounded bg-slate-200 animate-pulse" />
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
      dotBg: "bg-emerald-500",
      subtitleColor: "text-emerald-700",
    },
    {
      label: "Active",
      value: stats.active,
      subtitle: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of all communities`,
      icon: CheckCircle2,
      iconBg: "bg-[#E6F4F1]",
      iconColor: "text-[#0F766E]",
      dotBg: "bg-teal-500",
      subtitleColor: "text-[#0F766E]",
    },
    {
      label: "Pending Payment",
      value: stats.pending_payment,
      subtitle:
        stats.pending_payment > 0
          ? "Awaiting payment setup"
          : "No pending registrations",
      icon: Clock,
      iconBg: "bg-[#FFF7ED]",
      iconColor: "text-[#C2410C]",
      dotBg: stats.pending_payment > 0 ? "bg-amber-500" : "bg-emerald-500",
      subtitleColor: stats.pending_payment > 0 ? "text-[#C2410C]" : "text-emerald-700",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      subtitle:
        stats.inactive > 0
          ? "Deactivated or expired"
          : "All communities active",
      icon: XCircle,
      iconBg: "bg-[#FEF2F2]",
      iconColor: "text-[#DC2626]",
      dotBg: stats.inactive > 0 ? "bg-rose-500" : "bg-emerald-500",
      subtitleColor: stats.inactive > 0 ? "text-[#DC2626]" : "text-emerald-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="group relative flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
          >
            <div
              className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.8]" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                {card.label}
              </span>
              <div className="mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight block">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 min-w-0">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${card.dotBg}`} />
                <span className={`text-[11px] sm:text-xs font-medium truncate ${card.subtitleColor}`}>
                  {card.subtitle}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
