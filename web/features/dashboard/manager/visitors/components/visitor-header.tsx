"use client"

import {
  History,
  LogOut,
  UserCheck,
  Users,
} from "lucide-react"

import type { VisitorStats } from "../types/visitors"

interface VisitorHeaderProps {
  stats?: VisitorStats
  isLoading?: boolean
}

export default function VisitorHeader({
  stats,
  isLoading = false,
}: VisitorHeaderProps) {
  const statCards = [
    {
      title: "Total Visitors",
      description: "Recorded gate check-in logs",
      value: stats?.totalToday ?? 0,
      icon: Users,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
    {
      title: "Currently Inside",
      description: "Active guests on premises",
      value: stats?.currentlyInside ?? 0,
      icon: UserCheck,
      accent: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Checked Out",
      description: "Completed visits",
      value: stats?.checkedOutToday ?? 0,
      icon: LogOut,
      accent: "bg-slate-500",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Visitor History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and filter resident guest entries, gate logs, and visitor records.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] ${stat.accent}`}
              />

              <div className="flex items-start justify-between pl-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-700">
                    {stat.title}
                  </p>
                  <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                    {isLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-100 align-middle" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
              </div>

              <p className="mt-2.5 pl-2 text-xs font-medium text-slate-500">
                {stat.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
