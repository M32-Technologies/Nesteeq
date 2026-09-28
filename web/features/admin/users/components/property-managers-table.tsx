"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Building2,
  Phone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Home,
  Shield,
  Wrench,
} from "lucide-react"
import type { BetterAuthUser, ManagerFilterStatus, UserRoleFilter, UserKpiStats } from "../types"
import ManagerDetailsModal from "./manager-details-modal"

export function isAdminUser(user: { role?: string | null }): boolean {
  if (!user.role) return false
  const r = user.role.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return (
    r === "admin" ||
    r === "super_admin" ||
    r === "superadmin" ||
    r === "administrator"
  )
}

export type PropertyManagersTableProps = {
  managers?: BetterAuthUser[]
  users?: BetterAuthUser[]
  isLoading?: boolean
  onUserUpdated: () => void
  // Role Filter
  roleFilter?: UserRoleFilter
  onRoleFilterChange?: (role: UserRoleFilter) => void
  stats?: UserKpiStats | null
  // Optional controlled pagination
  currentPage?: number
  totalPages?: number
  totalItems?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

/**
 * Bulletproof User Avatar:
 * Prevents Next.js / native img alt text from overflowing inside the circle.
 * Falls back gracefully to a crisp 1-letter initial on a soothing gradient.
 */
function UserAvatar({
  name,
  email,
  image,
}: {
  name?: string | null
  email?: string | null
  image?: string | null
}) {
  const [hasError, setHasError] = useState(false)
  const initial = name?.trim()
    ? name.trim().charAt(0).toUpperCase()
    : email?.trim()
    ? email.trim().charAt(0).toUpperCase()
    : "U"

  const isValidUrl = Boolean(
    image &&
      (image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("/"))
  )

  if (!image || !isValidUrl || hasError) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#07584F] to-[#0A6B60] text-xs font-bold text-white shadow-2xs select-none">
        {initial}
      </span>
    )
  }

  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF5EE] shadow-2xs">
      <img
        src={image}
        alt=""
        onError={() => setHasError(true)}
        className="h-full w-full object-cover"
      />
    </span>
  )
}

/**
 * Visual Role Badge: Displays non-admin roles (Admin is never shown)
 */
function UserRoleBadge({ role }: { role?: string | null }) {
  const normalized = (role ?? "resident").trim().toLowerCase().replace(/[\s-]+/g, "_")

  if (normalized === "property_manager" || normalized === "propertymanager") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-semibold text-[#07584F] border border-emerald-200/60 whitespace-nowrap">
        <Building2 className="h-3 w-3 text-[#07584F]" />
        Property Manager
      </span>
    )
  }

  if (normalized === "facility_manager") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200/60 whitespace-nowrap">
        <Wrench className="h-3 w-3 text-amber-600" />
        Facility Manager
      </span>
    )
  }

  if (normalized === "security_staff") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">
        <Shield className="h-3 w-3 text-slate-600" />
        Security Staff
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200/60 whitespace-nowrap">
      <Home className="h-3 w-3 text-sky-600" />
      Resident
    </span>
  )
}

export default function PropertyManagersTable({
  managers,
  users,
  isLoading = false,
  onUserUpdated,
  roleFilter = "all",
  onRoleFilterChange,
  stats,
  currentPage: controlledCurrentPage,
  totalPages: controlledTotalPages,
  totalItems: controlledTotalItems,
  pageSize: propPageSize = 10,
  onPageChange: controlledOnPageChange,
}: PropertyManagersTableProps) {
  const [internalPage, setInternalPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ManagerFilterStatus>("all")
  const [selectedUser, setSelectedUser] = useState<BetterAuthUser | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const currentPage = controlledCurrentPage ?? internalPage
  const handlePageChange = controlledOnPageChange ?? setInternalPage

  // Reset page when filter or search changes
  useEffect(() => {
    setInternalPage(1)
  }, [roleFilter, searchTerm, statusFilter])

  // 1. Strictly filter out all admin and super_admin users
  const nonAdminUsers = useMemo(() => {
    const raw = users ?? managers ?? []
    return raw.filter((user) => !isAdminUser(user))
  }, [users, managers])

  // 2. Filter users by search query and account status
  const filteredUsers = useMemo(() => {
    return nonAdminUsers.filter((user) => {
      const name = (user.name || "").toLowerCase()
      const email = (user.email || "").toLowerCase()
      const phone = (user.phone || "").toLowerCase()
      const role = (user.role || "").toLowerCase()
      const apt = (user.apartmentId || "").toLowerCase()
      const flat = (user.flatId || "").toLowerCase()
      const query = searchTerm.toLowerCase().trim()

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        role.includes(query) ||
        apt.includes(query) ||
        flat.includes(query)

      if (!matchesSearch) return false

      if (statusFilter === "active") {
        return user.emailVerified && !user.banned
      }
      if (statusFilter === "inactive") {
        return !user.emailVerified && !user.banned
      }
      if (statusFilter === "banned") {
        return Boolean(user.banned)
      }

      return true
    })
  }, [nonAdminUsers, searchTerm, statusFilter])

  const totalItems = controlledTotalItems ?? filteredUsers.length
  const totalPages =
    controlledTotalPages ?? Math.max(1, Math.ceil(totalItems / propPageSize))

  const displayedUsers = useMemo(() => {
    if (controlledCurrentPage !== undefined && controlledTotalItems !== undefined) {
      return filteredUsers
    }
    const start = (currentPage - 1) * propPageSize
    return filteredUsers.slice(start, start + propPageSize)
  }, [
    filteredUsers,
    currentPage,
    propPageSize,
    controlledCurrentPage,
    controlledTotalItems,
  ])

  const handleOpenDetails = (user: BetterAuthUser) => {
    setSelectedUser(user)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedUser(null)
  }

  return (
    <>
      <div className="rounded-xl border border-[#EEF1EF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Header with Role Option Buttons, Search & Status Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF1EF]">
          {/* 1. Role Segmented Buttons (All Users / Managers / Residents) */}
          {onRoleFilterChange && (
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-2xs self-start lg:self-auto">
              <button
                type="button"
                onClick={() => onRoleFilterChange("all")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === "all"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>All Users</span>
                {stats?.totalUsers !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10.5px] font-bold tabular-nums ${
                      roleFilter === "all"
                        ? "bg-emerald-50 text-[#07584F]"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {stats.totalUsers}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRoleFilterChange("property_manager")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === "property_manager"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Managers</span>
                {stats?.propertyManagers !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10.5px] font-bold tabular-nums ${
                      roleFilter === "property_manager"
                        ? "bg-emerald-50 text-[#07584F]"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {stats.propertyManagers}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRoleFilterChange("resident")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === "resident"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Residents</span>
                {stats?.residents !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10.5px] font-bold tabular-nums ${
                      roleFilter === "resident"
                        ? "bg-emerald-50 text-[#07584F]"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {stats.residents}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* 2. Search & Status Filter */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, role..."
                className="h-8 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all hover:bg-slate-50 focus-within:border-[#07584F]">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={statusFilter}
                aria-label="Filter users by status"
                onChange={(e) => setStatusFilter(e.target.value as ManagerFilterStatus)}
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Pending Verification</option>
                <option value="banned">Suspended Only</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-[#94A3B8]" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] text-[#64748B] font-semibold border-b border-[#EEF1EF]">
              <tr>
                <th className="py-3.5 pl-6 pr-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Contact Number</th>
                <th className="py-3.5 px-4">Assigned Property</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EEF1EF] text-[#334155]">
              {isLoading ? (
                // Skeletons
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-40 rounded bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-24 rounded-md bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-28 rounded-lg bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="h-8 w-16 ml-auto rounded-lg bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        {roleFilter === "property_manager" ? (
                          <Building2 className="h-6 w-6 stroke-[1.5]" />
                        ) : (
                          <Users className="h-6 w-6 stroke-[1.5]" />
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                        {searchTerm || statusFilter !== "all"
                          ? "No users match your filters"
                          : roleFilter === "property_manager"
                          ? "No property managers registered yet"
                          : roleFilter === "resident"
                          ? "No residents registered yet"
                          : "No users registered yet"}
                      </p>
                      <p className="mt-1 text-xs text-[#94A3B8] max-w-sm">
                        {searchTerm || statusFilter !== "all"
                          ? "Try clearing the search input or changing the status filter dropdown."
                          : roleFilter === "property_manager"
                          ? "Property managers will automatically appear here once onboarded."
                          : "Registered users will automatically appear in this directory."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => {
                  const formattedDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#F8FAF8]/80 transition-colors group"
                    >
                      {/* User Profile */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.name}
                            email={user.email}
                            image={user.image}
                          />

                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                              {user.name || "Unnamed User"}
                            </p>
                            <p className="truncate text-xs text-[#64748B]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UserRoleBadge role={user.role} />
                      </td>

                      {/* Contact Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 font-medium text-[#334155]">
                            <Phone className="h-3 w-3 text-[#94A3B8]" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      {/* Assigned Property */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {user.apartmentId ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEF1EF] bg-[#F8FAF8] px-2.5 py-1 text-xs font-medium text-[#334155] w-fit">
                              <Building2 className="h-3 w-3 text-[#07584F]" />
                              <span className="font-mono text-[11px] truncate max-w-[120px]">
                                {user.apartmentId}
                              </span>
                            </span>
                            {user.flatId && (
                              <span className="text-[10.5px] text-[#64748B] pl-1 font-mono">
                                Flat: {user.flatId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {user.banned ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Suspended
                          </span>
                        ) : user.emailVerified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-medium text-[#14532D] border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3 text-[#14532D]" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Pending Verification
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#64748B]">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 hover:text-[#07584F] hover:border-[#07584F]/30 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#64748B]" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalItems > 0 && (
          <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between border-t border-[#EEF1EF]">
            <p className="text-xs text-[#64748B]">
              Showing{" "}
              <span className="font-semibold text-[#334155]">
                {Math.min((currentPage - 1) * propPageSize + 1, totalItems)}
              </span>
              {" "}–{" "}
              <span className="font-semibold text-[#334155]">
                {Math.min(currentPage * propPageSize, totalItems)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-[#334155]">
                {totalItems}
              </span>
              {" "}
              {roleFilter === "property_manager"
                ? "managers"
                : roleFilter === "resident"
                ? "residents"
                : "users"}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="px-2 text-xs font-medium text-[#64748B] tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <ManagerDetailsModal
        user={selectedUser}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onUserUpdated={onUserUpdated}
      />
    </>
  )
}
