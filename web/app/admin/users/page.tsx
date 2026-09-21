"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { RefreshCw, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import UserKpiCards from "@/features/admin/users/components/user-kpi-cards"
import PropertyManagersTable from "@/features/admin/users/components/property-managers-table"
import type { BetterAuthUser, UserKpiStats } from "@/features/admin/users/types"

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  // KPI stats state — fetched once from all users
  const [allUsers, setAllUsers] = useState<BetterAuthUser[]>([])
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  // Table state — paginated property managers
  const [tableUsers, setTableUsers] = useState<BetterAuthUser[]>([])
  const [totalTableUsers, setTotalTableUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isTableLoading, setIsTableLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 1. Fetch ALL users once for KPI stats (lightweight — we just need counts)
  const fetchStatsUsers = useCallback(async () => {
    setIsStatsLoading(true)
    try {
      const res = await authClient.admin.listUsers({
        query: { limit: 500 },
      })

      if (res.error) {
        setError(res.error.message || "Failed to load user stats.")
        return
      }

      const rawUsers = (res.data?.users || []) as BetterAuthUser[]
      setAllUsers(rawUsers)
    } catch {
      setError("Unable to connect to the authentication server.")
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  // 2. Fetch paginated property managers for the table
  const fetchTablePage = useCallback(
    async (page: number, showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true)
      else setIsTableLoading(true)
      setError(null)

      try {
        const offset = (page - 1) * PAGE_SIZE

        const res = await authClient.admin.listUsers({
          query: {
            limit: PAGE_SIZE,
            offset,
            filterField: "role",
            filterValue: "property_manager",
            filterOperator: "eq",
            sortBy: "createdAt",
            sortDirection: "desc",
          },
        })

        if (res.error) {
          setError(res.error.message || "Failed to load property managers.")
          return
        }

        const rawUsers = (res.data?.users || []) as BetterAuthUser[]
        const total = (res.data as Record<string, unknown>)?.total as number | undefined

        setTableUsers(rawUsers)
        setTotalTableUsers(total ?? rawUsers.length)
        setCurrentPage(page)
      } catch {
        setError("Unable to fetch property managers from the server.")
      } finally {
        setIsTableLoading(false)
        setIsRefreshing(false)
      }
    },
    []
  )

  // Initial load
  useEffect(() => {
    fetchStatsUsers()
    fetchTablePage(1)
  }, [fetchStatsUsers, fetchTablePage])

  // Compute KPI metrics (Excluding Admin role)
  const stats: UserKpiStats = useMemo(() => {
    const nonAdminUsers = allUsers.filter(
      (u) => u.role !== "admin" && u.role !== "super_admin"
    )

    const propertyManagers = allUsers.filter(
      (u) => u.role === "property_manager" || u.role === "propertymanager"
    )

    const verifiedManagers = propertyManagers.filter(
      (u) => u.emailVerified && !u.banned
    )

    const inactiveUsers = nonAdminUsers.filter(
      (u) => !u.emailVerified || Boolean(u.banned)
    )

    const totalBanned = nonAdminUsers.filter((u) => Boolean(u.banned))

    return {
      totalUsers: nonAdminUsers.length,
      propertyManagers: propertyManagers.length,
      verifiedManagers: verifiedManagers.length,
      inactiveUsers: inactiveUsers.length,
      totalBanned: totalBanned.length,
    }
  }, [allUsers])

  const totalPages = Math.max(1, Math.ceil(totalTableUsers / PAGE_SIZE))

  const handleRefresh = () => {
    fetchStatsUsers()
    fetchTablePage(currentPage, true)
  }

  const handleUserUpdated = () => {
    fetchStatsUsers()
    fetchTablePage(currentPage, false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Users & Property Managers
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Overview of platform users and property manager accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isTableLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#64748B] ${
                isRefreshing ? "animate-spin text-[#07584F]" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert if request fails */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Directory Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 1. KPI Metric Cards Section */}
      <UserKpiCards stats={stats} isLoading={isStatsLoading} />

      {/* 2. Property Managers Table Section (Paginated) */}
      <PropertyManagersTable
        managers={tableUsers}
        isLoading={isTableLoading}
        onUserUpdated={handleUserUpdated}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalTableUsers}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => fetchTablePage(page)}
      />
    </div>
  )
}
