import { CheckCircle2, Car, Ban, LayoutGrid } from "lucide-react"

import type { VisitorParkingSummary } from "../../../security/services/parking.service"

type ParkingSummaryProps = {
  summary?: VisitorParkingSummary
  isLoading: boolean
}

export default function ParkingSummary({
  summary,
  isLoading,
}: ParkingSummaryProps) {
  const cards = [
    {
      title: "Total Parking",
      description: "Configured parking slots",
      value: summary?.totalVisitorSlots ?? 0,
      icon: LayoutGrid,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      isValueLoading: isLoading,
    },
    {
      title: "Available",
      description: "Ready to use",
      value: summary?.available ?? 0,
      icon: CheckCircle2,
      accent: "bg-[#0F5F45]",
      iconBg: "bg-[#E7F4EE]",
      iconColor: "text-[#0F5F45]",
      isValueLoading: isLoading,
    },
    {
      title: "Occupied",
      description: "Currently in use",
      value: summary?.occupied ?? 0,
      icon: Car,
      accent: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
      isValueLoading: isLoading,
    },
    {
      title: "Out of Service",
      description: "Temporarily unavailable",
      value: summary?.outOfService ?? 0,
      icon: Ban,
      accent: "bg-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-red-700",
      isValueLoading: isLoading,
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
                  {card.isValueLoading ? (
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
