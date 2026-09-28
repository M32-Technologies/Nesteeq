"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle } from "lucide-react"

import ApartmentKpiCards from "@/features/admin/apartments/components/apartment-kpi-cards"
import ApartmentsTable from "@/features/admin/apartments/components/apartments-table"
import {
  fetchApartmentStats,
  fetchApartments,
} from "@/features/admin/apartments/api/apartment.api"
import type {
  ApartmentStats,
  ApartmentItem,
  ApartmentFilterStatus,
} from "@/features/admin/apartments/types"

const PAGE_SIZE = 10

export default function ApartmentsPage() {
  // KPI stats state
  const [stats, setStats] = useState<ApartmentStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  // Apartment list state
  const [apartments, setApartments] = useState<ApartmentItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE)
  const [isListLoading, setIsListLoading] = useState(true)

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApartmentFilterStatus>("all")
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "updatedAt" | "city">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [error, setError] = useState<string | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // 1. Load KPI statistics
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true)

    try {
      const data = await fetchApartmentStats()
      setStats(data)
    } catch {
      setError("Unable to load apartment statistics.")
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  // 2. Load Paginated Apartments List
  const loadApartments = useCallback(
    async (page: number) => {
      setIsListLoading(true)

      try {
        const res = await fetchApartments({
          page,
          limit: pageSize,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy,
          sortOrder,
        })

        setApartments(res.apartments || [])
        setCurrentPage(res.pagination?.page || page)
        setTotalPages(res.pagination?.totalPages || 1)
        setTotalItems(res.pagination?.total || 0)
      } catch {
        setError("Unable to load apartments from the server.")
      } finally {
        setIsListLoading(false)
      }
    },
    [debouncedSearch, statusFilter, sortBy, sortOrder, pageSize]
  )

  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Reload list when debounced search, status filter, sort, or page size changes (reset to page 1)
  useEffect(() => {
    setCurrentPage(1)
    loadApartments(1)
  }, [loadApartments])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      loadApartments(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleSortChange = (
    newSortBy: "name" | "createdAt" | "updatedAt" | "city",
    newSortOrder: "asc" | "desc"
  ) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Handle reload on update / try again
  const handleRefresh = async () => {
    setError(null)
    await Promise.all([loadStats(), loadApartments(currentPage)])
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Failed to load data</p>
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

      {/* KPI Cards */}
      <ApartmentKpiCards stats={stats} isLoading={isStatsLoading} />

      {/* Apartments Table */}
      <ApartmentsTable
        apartments={apartments}
        isLoading={isListLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        onApartmentUpdated={handleRefresh}
      />
    </div>
  )
}
