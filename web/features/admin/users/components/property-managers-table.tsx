"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import type { BetterAuthUser, ManagerFilterStatus } from "../types"
import ManagerDetailsModal from "./manager-details-modal"

type PropertyManagersTableProps = {
  managers: BetterAuthUser[]
  isLoading?: boolean
  onUserUpdated: () => void
  // Pagination
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

/**
 * Bulletproof Manager Avatar:
 * Prevents Next.js / native img alt text from overflowing inside the circle.
 * Falls back gracefully to a crisp 1-letter initial on a soothing gradient.
 */
function ManagerAvatar({
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
    : "M"

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

export default function PropertyManagersTable({
  managers,
  isLoading = false,
  onUserUpdated,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PropertyManagersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ManagerFilterStatus>("all")
  const [selectedManager, setSelectedManager] = useState<BetterAuthUser | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Filter managers exclusively by search and status
  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      const name = (manager.name || "").toLowerCase()
      const email = (manager.email || "").toLowerCase()
      const phone = (manager.phone || "").toLowerCase()
      const query = searchTerm.toLowerCase().trim()

      const matchesSearch =
        !query || name.includes(query) || email.includes(query) || phone.includes(query)

      if (!matchesSearch) return false

      if (statusFilter === "active") {
        return manager.emailVerified && !manager.banned
      }
      if (statusFilter === "inactive") {
        return !manager.emailVerified && !manager.banned
      }
      if (statusFilter === "banned") {
        return Boolean(manager.banned)
      }

      return true
    })
  }, [managers, searchTerm, statusFilter])

  const handleOpenDetails = (manager: BetterAuthUser) => {
    setSelectedManager(manager)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedManager(null)
  }

  return (
    <>
      <div className="rounded-xl border border-[#EEF1EF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Compact Table Header with Search & Filters */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEF1EF]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Property Managers
            </h2>
            <span className="rounded-md bg-[#EAF5EE] px-2 py-0.5 text-[11px] font-semibold text-[#14532D] tabular-nums">
              {managers.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box — border on wrapper so rounded shape stays on focus */}
            <div className="relative flex items-center w-full sm:w-56 rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email..."
                className="h-8 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
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
                aria-label="Filter managers by status"
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
                <th className="py-3.5 pl-6 pr-4">Property Manager</th>
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
              ) : filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Building2 className="h-6 w-6 stroke-[1.5]" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#0F172A]">
                        {searchTerm || statusFilter !== "all"
                          ? "No property managers match your filters"
                          : "No property managers registered yet"}
                      </p>
                      <p className="mt-1 text-xs text-[#94A3B8] max-w-sm">
                        {searchTerm || statusFilter !== "all"
                          ? "Try clearing the search input or changing the status filter dropdown."
                          : "Property managers will automatically appear here once they complete onboarding."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredManagers.map((manager) => {
                  const formattedDate = manager.createdAt
                    ? new Date(manager.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"

                  return (
                    <tr
                      key={manager.id}
                      className="hover:bg-[#F8FAF8]/80 transition-colors group"
                    >
                      {/* Property Manager Profile */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <ManagerAvatar
                            name={manager.name}
                            email={manager.email}
                            image={manager.image}
                          />

                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0F172A] truncate group-hover:text-[#07584F] transition-colors">
                              {manager.name || "Unnamed Manager"}
                            </p>
                            <p className="truncate text-xs text-[#64748B]">
                              {manager.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {manager.phone ? (
                          <div className="flex items-center gap-1.5 font-medium text-[#334155]">
                            <Phone className="h-3 w-3 text-[#94A3B8]" />
                            <span>{manager.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      {/* Assigned Property */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {manager.apartmentId ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEF1EF] bg-[#F8FAF8] px-2.5 py-1 text-xs font-medium text-[#334155]">
                            <Building2 className="h-3 w-3 text-[#07584F]" />
                            <span className="font-mono text-[11px] truncate max-w-[120px]">
                              {manager.apartmentId}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {manager.banned ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Suspended
                          </span>
                        ) : manager.emailVerified ? (
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
                          onClick={() => handleOpenDetails(manager)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 hover:text-[#07584F] hover:border-[#07584F]/30 transition-colors"
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
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
              </span>
              –
              <span className="font-semibold text-[#334155]">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-[#334155]">
                {totalItems}
              </span>
              {" "}managers
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="px-2 text-xs font-medium text-[#64748B] tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
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
        user={selectedManager}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onUserUpdated={onUserUpdated}
      />
    </>
  )
}
