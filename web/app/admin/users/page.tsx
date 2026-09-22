"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle } from "lucide-react"
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
    async (page: number) => {
      setIsTableLoading(true)
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
    fetchTablePage(currentPage)
  }

  const handleUserUpdated = () => {
    fetchStatsUsers()
    fetchTablePage(currentPage)
  }

  return (
    <div className="space-y-6">

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
