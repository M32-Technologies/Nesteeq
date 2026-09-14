"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, CheckCircle, Clock, Wrench, type LucideIcon } from "lucide-react"

import { getMaintenanceDashboardStats } from "../services/maintenance.service"

export const maintenanceQueryKeys = {
  all: ["maintenance"] as const,
  dashboard: () => [...maintenanceQueryKeys.all, "dashboard"] as const,
}

export function useMaintenanceDashboardStatsQuery() {
  return useQuery({
    queryKey: maintenanceQueryKeys.dashboard(),
    queryFn: getMaintenanceDashboardStats,
    staleTime: 60 * 1000,
  })
}

export default function MaintenanceStats() {
  const { data, isLoading, isError, error } = useMaintenanceDashboardStatsQuery()

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
      title: "Total Assigned Jobs",
      description: "All jobs assigned to you",
      value: data?.stats.totalAssigned ?? 0,
      icon: Wrench,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
    {
      title: "Pending",
      description: "Awaiting start",
      value: data?.stats.pending ?? 0,
      icon: Clock,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "In Progress",
      description: "Currently being worked on",
      value: data?.stats.inProgress ?? 0,
      icon: Activity,
      accent: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
    },
    {
      title: "Completed Jobs",
      description: "Successfully resolved",
      value: data?.stats.completed ?? 0,
      icon: CheckCircle,
      accent: "bg-[#0F5F45]",
      iconBg: "bg-[#E7F4EE]",
      iconColor: "text-[#0F5F45]",
    },
  ]

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        {error instanceof Error
          ? error.message
          : "Failed to load dashboard stats."}
      </p>
    )
  }

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