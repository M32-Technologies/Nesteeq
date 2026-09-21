"use client"

import { Users, Building2, UserX, Clock, CheckCircle2 } from "lucide-react"
import type { UserKpiStats } from "../types"

type UserKpiCardsProps = {
  stats: UserKpiStats | null
  isLoading?: boolean
}

export default function UserKpiCards({ stats, isLoading = false }: UserKpiCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-16 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      {/* 1. Total Platform Users Card */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#07584F] transition-transform duration-200 group-hover:scale-105">
          <Users className="h-6 w-6 stroke-[1.8]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-[#64748B] block">
            Total Platform Users
          </span>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#059669] font-medium flex items-center gap-1 truncate">
            <span>↗</span>
            <span>Excluding system administrators</span>
          </p>
        </div>
      </div>

      {/* 2. Property Managers Card */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F4F1] text-[#0F766E] transition-transform duration-200 group-hover:scale-105">
          <Building2 className="h-6 w-6 stroke-[1.8]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-[#64748B] block">
            Property Managers
          </span>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {stats.propertyManagers.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#0F766E] font-medium flex items-center gap-1 truncate">
            <CheckCircle2 className="h-3 w-3" />
            <span>{stats.verifiedManagers} active community overseers</span>
          </p>
        </div>
      </div>

      {/* 3. Pending Verification Card */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C2410C] transition-transform duration-200 group-hover:scale-105">
          {stats.totalBanned > 0 ? (
            <UserX className="h-6 w-6 stroke-[1.8]" />
          ) : (
            <Clock className="h-6 w-6 stroke-[1.8]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-[#64748B] block">
            Pending Verification
          </span>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {stats.inactiveUsers.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium flex items-center gap-1 truncate">
            {stats.totalBanned > 0 ? (
              <span className="text-[#C2410C]">⚠ {stats.totalBanned} suspended · {stats.inactiveUsers - stats.totalBanned} unverified</span>
            ) : stats.inactiveUsers > 0 ? (
              <span className="text-[#C2410C]">Users who haven&apos;t verified email yet</span>
            ) : (
              <span className="text-emerald-600 font-normal">All accounts verified ✓</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
