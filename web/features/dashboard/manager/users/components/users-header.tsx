"use client"

import {
  Mail,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react"

import { useUserStatsQuery } from "../hooks/use-residents-query"
import type { UserStats } from "../types/users"

export type UsersTab = "members" | "pending"

interface UsersHeaderProps {
  activeTab: UsersTab
  onTabChange: (tab: UsersTab) => void
  onInviteClick: () => void
}

export default function UsersHeader({
  activeTab,
  onTabChange,
  onInviteClick,
}: UsersHeaderProps) {
  const { data, isLoading } = useUserStatsQuery()
  const statCards: {
    title: string
    description: string
    key: keyof UserStats
    icon: typeof Users
    accent: string
    iconBg: string
    iconColor: string
    tab: UsersTab
  }[] = [
    {
      title: "Total Users",
      description: "Current residents",
      key: "totalUsers",
      icon: Users,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      tab: "members",
    },
    {
      title: "Active Users",
      description: "Currently active",
      key: "activeUsers",
      icon: UserCheck,
      accent: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      tab: "members",
    },
    {
      title: "Pending Invites",
      description: "Sent invitations",
      key: "pendingUsers",
      icon: Mail,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      tab: "pending",
    },
    {
      title: "Inactive",
      description: "Deactivated users",
      key: "inactiveUsers",
      icon: UserX,
      accent: "bg-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      tab: "members",
    },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage apartment owners, residents, and sent invitations.
          </p>
        </div>

        <button
          type="button"
          onClick={onInviteClick}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45] focus-visible:ring-offset-2 active:bg-[#093D2C]"
        >
          <UserPlus size={16} strokeWidth={2.25} />
          Invite Users
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const value = data?.[stat.key] ?? 0
          const isActive = activeTab === stat.tab

          return (
            <button
              key={stat.title}
              type="button"
              aria-pressed={isActive}
              onClick={() => onTabChange(stat.tab)}
              className={`group relative overflow-hidden rounded-xl border bg-white p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45] focus-visible:ring-offset-2 ${
                isActive
                  ? "border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] transition-opacity ${stat.accent} ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-30"
                }`}
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
                      value
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
              </div>

              <p className="mt-2.5 pl-2 text-xs font-medium text-slate-600">
                {stat.description}
              </p>
            </button>
          )
        })}
      </div>

      <div role="tablist" className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "members"}
          onClick={() => onTabChange("members")}
          className={`relative -mb-px flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Members
          {activeTab === "members" && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0F5F45]" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pending"}
          onClick={() => onTabChange("pending")}
          className={`relative -mb-px flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pending Invites
          {!isLoading && (data?.pendingUsers ?? 0) > 0 ? (
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                activeTab === "pending"
                  ? "bg-[#0F5F45] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {data?.pendingUsers}
            </span>
          ) : null}
          {activeTab === "pending" && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0F5F45]" />
          )}
        </button>
      </div>
    </div>
  )
}
