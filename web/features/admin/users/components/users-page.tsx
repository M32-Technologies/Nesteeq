"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import UserKpiCards from "@/features/admin/users/components/user-kpi-cards"
import PropertyManagersTable, {
  isAdminUser,
} from "@/features/admin/users/components/property-managers-table"
import type { BetterAuthUser, UserKpiStats, UserRoleFilter } from "@/features/admin/users/types"

export function isManagerUser(user: { role?: string | null }): boolean {
  if (!user.role) return false
  const r = user.role.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return (
    r === "property_manager" ||
    r === "propertymanager" ||
    r === "property-manager" ||
    r === "manager"
  )
}

export function isResidentUser(user: { role?: string | null }): boolean {
  if (isAdminUser(user)) return false
  if (isManagerUser(user)) return false
  if (!user.role) return true
  const r = user.role.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return (
    r === "resident" ||
    r === "owner" ||
    r === "tenant" ||
    (!r && !isAdminUser(user))
  )
}

export default function UsersPage() {
  // All non-admin platform users
  const [allUsers, setAllUsers] = useState<BetterAuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Role filter state — "all" | "property_manager" | "resident"
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all")

  const [error, setError] = useState<string | null>(null)

  // 1. Fetch ALL users and strictly filter out any admin or super_admin account
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      })

      if (res.error) {
        setError(res.error.message || "Failed to load user directory.")
        return
      }

      const rawUsers = (res.data?.users || []) as BetterAuthUser[]
      // Strictly exclude any admin or super_admin user
      const nonAdminUsers = rawUsers.filter((u) => !isAdminUser(u))
      setAllUsers(nonAdminUsers)
    } catch {
      setError("Unable to connect to the authentication server.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Compute KPI metrics — Admins are 100% excluded from all counts
  const stats: UserKpiStats = useMemo(() => {
    const nonAdminUsers = allUsers.filter((u) => !isAdminUser(u))

    const propertyManagers = nonAdminUsers.filter((u) => isManagerUser(u))

    const residents = nonAdminUsers.filter((u) => isResidentUser(u))

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
      residents: residents.length,
      verifiedManagers: verifiedManagers.length,
      inactiveUsers: inactiveUsers.length,
      totalBanned: totalBanned.length,
    }
  }, [allUsers])

  // Filter users based on selected option button (All Users / Managers / Residents)
  const currentRoleUsers = useMemo(() => {
    const nonAdminUsers = allUsers.filter((u) => !isAdminUser(u))
    if (roleFilter === "property_manager") {
      return nonAdminUsers.filter((u) => isManagerUser(u))
    }
    if (roleFilter === "resident") {
      return nonAdminUsers.filter((u) => isResidentUser(u))
    }
    return nonAdminUsers
  }, [allUsers, roleFilter])

  const handleRoleFilterChange = (newRole: UserRoleFilter) => {
    setRoleFilter(newRole)
  }

  const handleRefresh = () => {
    fetchUsers()
  }

  const handleUserUpdated = () => {
    fetchUsers()
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
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 1. KPI Metric Cards Section (Admins excluded) */}
      <UserKpiCards stats={stats} isLoading={isLoading} />

      {/* 2. Users Table Section (No admins, option button filterable) */}
      <PropertyManagersTable
        users={currentRoleUsers}
        isLoading={isLoading}
        onUserUpdated={handleUserUpdated}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        stats={stats}
      />
    </div>
  )
}
