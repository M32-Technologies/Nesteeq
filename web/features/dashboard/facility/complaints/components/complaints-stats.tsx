"use client"

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  UserRoundCog,
  Wrench,
} from "lucide-react"

import type { FacilityComplaintStats } from "@/features/dashboard/facility/complaints/types/complaints.types"

interface ComplaintsStatsProps {
  stats?: FacilityComplaintStats
  isLoading?: boolean
}

export function ComplaintsStats({
  stats,
  isLoading = false,
}: ComplaintsStatsProps) {
  const total = stats?.total ?? 0
  const pending = stats?.pending ?? 0
  const assigned = stats?.assigned ?? 0
  const inProgress = stats?.inProgress ?? 0
  const resolved = stats?.resolved ?? 0

  const cards = [
    {
      title: "Total Complaints",
      value: total,
      description: "All logged complaints",
      icon: ClipboardList,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      badge: null,
    },
    {
      title: "Pending Review",
      value: pending,
      description: "Awaiting review or triage",
      icon: Clock,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      badge:
        pending > 0
          ? {
              text: "Action Needed",
              style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
            }
          : {
              text: "All Clear",
              style: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
            },
    },
    {
      title: "Staff Assigned",
      value: assigned,
      description: "Assigned to technicians",
      icon: UserRoundCog,
      accent: "bg-purple-600",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-700",
      badge: null,
    },
    {
      title: "In Progress",
      value: inProgress,
      description: "Active repairs underway",
      icon: Wrench,
      accent: "bg-blue-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      badge: null,
    },
    {
      title: "Resolved",
      value: resolved,
      description: "Successfully addressed",
      icon: CheckCircle2,
      accent: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      badge:
        total > 0 && resolved > 0
          ? {
              text: `${Math.round((resolved / total) * 100)}% resolved`,
              style: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
            }
          : null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#0F5F45]/30 hover:shadow-xs"
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
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${card.badge.style}`}
                    >
                      {card.badge.text}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[22px] font-bold tabular-nums leading-none tracking-tight text-slate-900">
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

export default ComplaintsStats
