"use client"

import { CreditCard, CheckCircle2, Sparkles, CalendarDays } from "lucide-react"
import type { SubscriptionPlan } from "../types"

type PlanKpiCardsProps = {
  plans: SubscriptionPlan[]
  isLoading?: boolean
}

export default function PlanKpiCards({
  plans,
  isLoading = false,
}: PlanKpiCardsProps) {
  const totalPlans = plans.length
  const activePlans = plans.filter((p) => p.isActive).length
  const trialPlans = plans.filter((p) => p.freeTrial?.enabled).length
  const avgDuration =
    totalPlans > 0
      ? Math.round(
          plans.reduce((acc, p) => acc + (p.durationMonths || 0), 0) / totalPlans
        )
      : 0

  const cards = [
    {
      label: "Configured Plans",
      value: totalPlans,
      subtext: "Total subscription tiers",
      icon: CreditCard,
      iconColor: "text-[#07584F]",
      iconBg: "bg-[#EAF5EE]",
    },
    {
      label: "Active Offerings",
      value: activePlans,
      subtext: `${totalPlans - activePlans} inactive or hidden`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Trial-Enabled Tiers",
      value: trialPlans,
      subtext: "Tiers with free onboarding days",
      icon: Sparkles,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      label: "Avg. Duration",
      value: `${avgDuration} mos`,
      subtext: "Standard billing term",
      icon: CalendarDays,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs animate-pulse"
          >
            <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
            <div className="h-7 w-16 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                {card.label}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {card.value}
              </div>
              <p className="mt-0.5 text-[11px] text-[#94A3B8]">{card.subtext}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
