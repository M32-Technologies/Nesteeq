"use client"

import {
  Clock,
  Package,
  PackageCheck,
  RotateCcw,
} from "lucide-react"
import type { DeliveryStats } from "../types/deliveries"

interface DeliveryStatsCardsProps {
  stats?: DeliveryStats
  isLoading?: boolean
}

export default function DeliveryStatsCards({
  stats,
  isLoading = false,
}: DeliveryStatsCardsProps) {
  const total = stats?.total ?? 0
  const waiting = (stats?.waiting ?? 0) + (stats?.notified ?? 0)
  const collected = stats?.collected ?? 0
  const returned = stats?.returned ?? 0

  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0
  const returnRate = total > 0 ? ((returned / total) * 100).toFixed(1) : "0.0"

  const cards = [
    {
      title: "Total Deliveries",
      value: total,
      description: "Parcels received in period",
      icon: Package,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      badge: null,
    },
    {
      title: "Awaiting Pickup",
      value: waiting,
      description: `${stats?.waiting ?? 0} at gate, ${stats?.notified ?? 0} notified`,
      icon: Clock,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      badge:
        waiting > 0
          ? { text: "Action Needed", style: "bg-amber-50 text-amber-700 ring-amber-200/60" }
          : { text: "All Clear", style: "bg-slate-100 text-slate-600 ring-slate-200" },
    },
    {
      title: "Collected",
      value: collected,
      description: `${collectionRate}% overall collection rate`,
      icon: PackageCheck,
      accent: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      badge: {
        text: `${collectionRate}%`,
        style: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
      },
    },
    {
      title: "Returned to Courier",
      value: returned,
      description: `${returnRate}% uncollected / returned`,
      icon: RotateCcw,
      accent: "bg-rose-500",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-700",
      badge:
        returned > 0
          ? { text: `${returned} Returned`, style: "bg-rose-50 text-rose-700 ring-rose-200/60" }
          : null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md"
          >
            {/* Color Accent Indicator Strip */}
            <span
              className={`absolute inset-y-0 left-0 w-[3px] ${card.accent}`}
            />

            <div className="flex items-start justify-between pl-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-slate-700">
                    {card.title}
                  </p>
                  {card.badge && (
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ${card.badge.style}`}
                    >
                      {card.badge.text}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                  {isLoading ? (
                    <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-100 align-middle" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
              >
                <Icon size={17} strokeWidth={2} />
              </div>
            </div>

            <p className="mt-2.5 pl-2 text-xs font-medium text-slate-500 truncate">
              {isLoading ? (
                <span className="inline-block h-3 w-28 animate-pulse rounded bg-slate-100" />
              ) : (
                card.description
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
