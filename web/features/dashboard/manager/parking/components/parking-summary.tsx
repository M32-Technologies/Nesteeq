"use client"

import {
  Ban,
  Car,
  CheckCircle2,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { ParkingStats } from "../types/parking.types"

type ParkingSummaryProps = {
  stats?: ParkingStats
  isLoading: boolean
}

export default function ParkingSummary({
  stats,
  isLoading,
}: ParkingSummaryProps) {
  const total = stats?.total ?? 0
  const available = stats?.available ?? 0
  const assigned = stats?.assigned ?? 0
  const occupied = stats?.occupied ?? 0
  const inactive = stats?.inactive ?? 0
  const residentSlots = stats?.residentSlots ?? 0
  const visitorSlots = stats?.visitorSlots ?? 0

  const cards: {
    title: string
    description: string
    value: number
    icon: LucideIcon
    accent: string
    iconBg: string
    iconColor: string
  }[] = [
    {
      title: "Total Slots",
      description: `${residentSlots} resident / ${visitorSlots} visitor`,
      value: total,
      icon: LayoutGrid,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
    {
      title: "Available",
      description: "Ready for vehicle parking",
      value: available,
      icon: CheckCircle2,
      accent: "bg-[#0F5F45]",
      iconBg: "bg-[#E7F4EE]",
      iconColor: "text-[#0F5F45]",
    },
    {
      title: "Assigned",
      description: "Assigned to resident flats",
      value: assigned,
      icon: Users,
      accent: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
    },
    {
      title: "Occupied / Inactive",
      description: `${occupied} occupied / ${inactive} inactive`,
      value: occupied + inactive,
      icon: inactive > 0 ? Ban : Car,
      accent: inactive > 0 ? "bg-amber-500" : "bg-sky-500",
      iconBg: inactive > 0 ? "bg-amber-50" : "bg-sky-50",
      iconColor: inactive > 0 ? "text-amber-700" : "text-sky-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          >
            <span
              className={`absolute inset-y-0 left-0 w-[3px] ${card.accent}`}
            />

            <div className="flex items-start justify-between pl-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-700">
                  {card.title}
                </p>
                <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                  {isLoading ? (
                    <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-100 align-middle" />
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

            <p className="mt-2.5 pl-2 text-xs font-medium text-slate-600">
              {card.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
