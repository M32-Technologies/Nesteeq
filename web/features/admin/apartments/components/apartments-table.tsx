"use client"

import { useState } from "react"
import {
  Building2,
  MapPin,
  Eye,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Layers,
} from "lucide-react"
import type {
  ApartmentItem,
  ApartmentFilterStatus,
} from "../types"
import ApartmentDetailsDrawer from "./apartment-details-drawer"

type ApartmentsTableProps = {
  apartments: ApartmentItem[]
  isLoading?: boolean
  // Pagination
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  // Filters & Search
  searchTerm: string
  onSearchChange: (query: string) => void
  statusFilter: ApartmentFilterStatus
  onStatusFilterChange: (status: ApartmentFilterStatus) => void
  onClearFilters: () => void
  onApartmentUpdated?: () => void
}

export default function ApartmentsTable({
  apartments,
  isLoading = false,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  onApartmentUpdated,
}: ApartmentsTableProps) {
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== "all")

  const handleOpenDetails = (id: string) => {
    setSelectedApartmentId(id)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedApartmentId(null)
  }

  const renderStatusBadge = (status: ApartmentItem["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EE] border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#07584F]">
            <CheckCircle2 className="h-3 w-3 text-[#07584F]" />
            <span>Active</span>
          </span>
        )
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#C2410C]">
            <Clock className="h-3 w-3 text-[#C2410C]" />
            <span>Pending Payment</span>
          </span>
        )
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] border border-red-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            <XCircle className="h-3 w-3 text-[#DC2626]" />
            <span>Inactive</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {status}
          </span>
        )
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[#EEF1EF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Header: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF1EF]">
          {/* Search Box — focus ring on wrapper */}
          <div className="relative flex-1 flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apartment, city, address..."
              className="h-8.5 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">

            {/* Status Filter */}
            <div className="relative flex items-center rounded-lg border border-[#E2E8F0] bg-white transition-all hover:bg-slate-50 focus-within:border-[#07584F]">
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={statusFilter}
                aria-label="Filter apartments by status"
                onChange={(e) =>
                  onStatusFilterChange(e.target.value as ApartmentFilterStatus)
                }
                className="h-8 rounded-lg border-0 bg-transparent pl-7 pr-7 text-xs font-medium text-[#334155] outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#94A3B8]" />
            </div>

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-[#CBD5E1] bg-white px-2.5 text-xs font-medium text-[#64748B] hover:border-slate-400 hover:text-[#0F172A] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EEF1EF] bg-slate-50/70 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                <th className="py-3 px-5">Apartment / Community</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Specs</th>
                <th className="py-3 px-4">Plan Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#334155]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-32 rounded bg-slate-200" />
                          <div className="h-2.5 w-44 rounded bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-16 rounded-full bg-slate-200" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-7 w-16 rounded bg-slate-200 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : apartments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#07584F]">
                      <Building2 className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                      No apartments found
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
                      {hasActiveFilters
                        ? "Try adjusting your search terms or filters to find what you're looking for."
                        : "No apartment communities have been registered yet."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                apartments.map((apartment) => {
                  const sub = apartment.currentSubscription
                  const planName = sub?.planSnapshot?.planName || sub?.planSnapshot?.name
                  const planInterval = sub?.planSnapshot?.planType || sub?.planSnapshot?.interval

                  return (
                    <tr
                      key={apartment._id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      {/* Community name & address */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-100">
                            <Building2 className="h-4.5 w-4.5 stroke-[1.8]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] hover:text-[#07584F] transition-colors truncate">
                              {apartment.name}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-[#64748B] truncate mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0 text-[#94A3B8]" />
                              <span className="truncate">{apartment.address}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-xs font-medium text-[#334155] whitespace-nowrap">
                        {apartment.city}
                        {apartment.state ? `, ${apartment.state}` : ""}
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-[#334155]">
                          <Layers className="h-3.5 w-3.5 text-[#07584F] shrink-0" />
                          <span className="font-semibold text-[#0F172A]">
                            {apartment.totalUnits}
                          </span>
                          <span className="text-[#64748B]">Units</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[#64748B]">
                            {apartment.totalBlocks} Blks
                          </span>
                        </div>
                      </td>

                      {/* Plan Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {planName ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF5EE] border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-[#07584F]">
                            <CreditCard className="h-3.5 w-3.5 text-[#07584F]" />
                            <span>{planName}</span>
                          </span>
                        ) : apartment.status === "pending_payment" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            <Clock className="h-3 w-3" />
                            <span>Pending Payment</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(apartment.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(apartment._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#07584F] shadow-2xs hover:bg-[#EAF5EE] hover:border-emerald-300 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#07584F]" />
                          <span>View</span>
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
              {" "}–{" "}
              <span className="font-semibold text-[#334155]">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-[#334155]">
                {totalItems}
              </span>
              {" "}apartments
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
                {currentPage} / {Math.max(1, totalPages)}
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

      {/* Apartment Details Drawer */}
      <ApartmentDetailsDrawer
        apartmentId={selectedApartmentId}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onApartmentUpdated={onApartmentUpdated}
      />
    </>
  )
}
