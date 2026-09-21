"use client"

import {
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
} from "lucide-react"

import type { MaintenanceStats } from "../types/maintenance"

interface MaintenanceHeaderProps {
  stats?: MaintenanceStats
  isLoading?: boolean
}

export default function MaintenanceHeader({
  stats,
  isLoading = false,
}: MaintenanceHeaderProps) {
  const statCards = [
    {
      title: "Active Works",
      description: "Ongoing property maintenance jobs",
      value: stats?.activeJobs ?? 0,
      icon: Wrench,
      accent: "bg-blue-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      title: "Technicians On Duty",
      description: "Workers actively on site",
      value: stats?.workersOnDuty ?? 0,
      icon: UserCheck,
      accent: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Works In Progress",
      description: "Tasks currently being executed",
      value: stats?.pendingAssignment ?? 0,
      icon: Clock,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "Completed Works",
      description: "Finished and verified maintenance",
      value: stats?.completedToday ?? 0,
      icon: CheckCircle2,
      accent: "bg-slate-500",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Title (Read-only monitoring header) */}
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Maintenance Work Progress
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor ongoing property repairs, real-time work status, and assigned technician activity.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
