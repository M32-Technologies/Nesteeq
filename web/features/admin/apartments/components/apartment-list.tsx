"use client"

import { useState } from "react"
import {
  Building2,
  MapPin,
  Phone,
  Layers,
  Car,
  Eye,
  ExternalLink,
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
  Building,
} from "lucide-react"
import type {
  ApartmentItem,
  ApartmentFilterStatus,
} from "../types"

type ApartmentListProps = {
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
}

export default function ApartmentList({
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
}: ApartmentListProps) {
  const [selectedApartment, setSelectedApartment] = useState<ApartmentItem | null>(null)

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== "all")

  // Format date helper
  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "N/A"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return String(dateStr)
    }
  }

  // Render Status Badge
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
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-[#EEF1EF] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Communities
            </h2>
            <span className="rounded-md bg-[#EAF5EE] px-2 py-0.5 text-[11px] font-semibold text-[#07584F] tabular-nums">
              {totalItems}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input Box — focus ring on wrapper to preserve rounded corners */}
            <div className="relative flex items-center w-full sm:w-64 rounded-lg border border-[#E2E8F0] bg-white transition-all focus-within:border-[#07584F] focus-within:ring-1 focus-within:ring-[#07584F]/10">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search apartment, city, address..."
                className="h-8 w-full rounded-lg border-0 bg-transparent pl-8.5 pr-7 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:outline-none focus:ring-0"
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
      </div>

      {/* Horizontal Cards Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-56 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : apartments.length === 0 ? (
        <div className="rounded-2xl border border-[#EEF1EF] bg-white py-14 px-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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
        </div>
      ) : (
        <div className="space-y-3">
          {apartments.map((apartment) => {
            const sub = apartment.currentSubscription
            const planName = sub?.planSnapshot?.name
            const planInterval = sub?.planSnapshot?.interval

            return (
              <div
                key={apartment._id}
                className="group relative rounded-2xl border border-[#EEF1EF] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Column: Building Emblem + Community Identity */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-100 transition-transform duration-200 group-hover:scale-105">
                      <Building2 className="h-6 w-6 stroke-[1.8]" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Name & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">
                          {apartment.name}
                        </h3>
                        {renderStatusBadge(apartment.status)}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                        <span className="truncate">
                          {apartment.address}
                          {apartment.city ? `, ${apartment.city}` : ""}
                          {apartment.state ? `, ${apartment.state}` : ""}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-[#64748B]">
                        {apartment.contactNumber && (
                          <div className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[#94A3B8]" />
                            <span>{apartment.contactNumber}</span>
                          </div>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-[#94A3B8]">
                          Registered {formatDate(apartment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Property Specs Chips */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-y lg:border-y-0 lg:border-x border-[#F1F5F9] py-3 lg:py-0 lg:px-5">
                    {/* Units */}
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#334155]">
                      <Layers className="h-3.5 w-3.5 text-[#07584F]" />
                      <span className="font-semibold text-[#0F172A]">
                        {apartment.totalUnits}
                      </span>
                      <span className="text-[#64748B]">Units</span>
                    </div>

                    {/* Blocks & Floors */}
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#334155]">
                      <Building className="h-3.5 w-3.5 text-[#07584F]" />
                      <span className="font-semibold text-[#0F172A]">
                        {apartment.totalBlocks}
                      </span>
                      <span className="text-[#64748B]">
                        {apartment.totalFloors
                          ? `Blks / ${apartment.totalFloors} Flrs`
                          : "Blocks"}
                      </span>
                    </div>

                    {/* Parking Slots */}
                    {apartment.parkingSlots && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#334155]">
                        <Car className="h-3.5 w-3.5 text-[#07584F]" />
                        <span className="font-semibold text-[#0F172A]">
                          {apartment.parkingSlots}
                        </span>
                        <span className="text-[#64748B]">Parking</span>
                      </div>
                    )}

                    {/* Subscription Pill */}
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAF8] border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#334155]">
                      <CreditCard className="h-3.5 w-3.5 text-[#07584F]" />
                      {planName ? (
                        <span className="text-[#0F172A] font-medium">
                          {planName}{" "}
                          <span className="text-[#64748B] text-[11px] capitalize">
                            ({planInterval || "Monthly"})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] italic">No Plan</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedApartment(apartment)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#64748B]" />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedApartment(apartment)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#064e46] transition-colors"
                    >
                      <span>Manage</span>
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-200" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#EEF1EF] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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

      {/* Quick Details View Dialog / Preview */}
      {selectedApartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[#EEF1EF] bg-white p-6 shadow-xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F172A]">
                    {selectedApartment.name}
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    {selectedApartment.address}, {selectedApartment.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApartment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="space-y-3 rounded-xl bg-[#F8FAF8] p-4 border border-[#EEF1EF] text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#64748B] block">Status</span>
                  <div className="mt-1">
                    {renderStatusBadge(selectedApartment.status)}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B] block">Total Units</span>
                  <span className="font-semibold text-[#0F172A] mt-1 block">
                    {selectedApartment.totalUnits} Units
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Blocks / Floors</span>
                  <span className="font-semibold text-[#0F172A] mt-1 block">
                    {selectedApartment.totalBlocks} Blocks
                    {selectedApartment.totalFloors ? ` (${selectedApartment.totalFloors} Floors)` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Parking Slots</span>
                  <span className="font-semibold text-[#0F172A] mt-1 block">
                    {selectedApartment.parkingSlots || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Contact Number</span>
                  <span className="font-semibold text-[#0F172A] mt-1 block">
                    {selectedApartment.contactNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Registered On</span>
                  <span className="font-semibold text-[#0F172A] mt-1 block">
                    {formatDate(selectedApartment.createdAt)}
                  </span>
                </div>
              </div>

              {selectedApartment.currentSubscription && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B] block">Current Subscription</span>
                  <div className="mt-1 flex items-center justify-between font-semibold text-[#0F172A]">
                    <span>
                      {selectedApartment.currentSubscription.planSnapshot?.name || "Standard Plan"}
                    </span>
                    <span className="text-[#07584F] capitalize">
                      {selectedApartment.currentSubscription.status || "active"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApartment(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
