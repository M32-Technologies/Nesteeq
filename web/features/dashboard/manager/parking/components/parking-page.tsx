"use client"

import { useEffect, useMemo, useState } from "react"
import { Car, Plus, Sparkles } from "lucide-react"

import {
  useParkingSlotsQuery,
  useParkingStatsQuery,
} from "../hooks/use-parking-queries"
import type {
  ParkingSortBy,
  ParkingSortOption,
  ParkingSortOrder,
  ParkingStatusFilter,
  ParkingUsageFilter,
  ParkingVehicleFilter,
} from "../types/parking.types"
import { GenerateSlotsDialog } from "./generate-slots-dialog"
import ParkingSummary from "./parking-summary"
import ParkingTable from "./parking-table"

export default function ParkingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ParkingStatusFilter>("ALL")
  const [usageFilter, setUsageFilter] = useState<ParkingUsageFilter>("ALL")
  const [vehicleFilter, setVehicleFilter] =
    useState<ParkingVehicleFilter>("ALL")
  const [levelFilter, setLevelFilter] = useState("")
  const [debouncedLevelFilter, setDebouncedLevelFilter] = useState("")
  const [zoneFilter, setZoneFilter] = useState("")
  const [debouncedZoneFilter, setDebouncedZoneFilter] = useState("")
  const [sortOption, setSortOption] =
    useState<ParkingSortOption>("slot_asc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
      setDebouncedLevelFilter(levelFilter.trim())
      setDebouncedZoneFilter(zoneFilter.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery, levelFilter, zoneFilter])

  const { sortBy, sortOrder } = useMemo<{
    sortBy: ParkingSortBy
    sortOrder: ParkingSortOrder
  }>(() => {
    switch (sortOption) {
      case "newest":
        return { sortBy: "createdAt", sortOrder: "desc" }
      case "oldest":
        return { sortBy: "createdAt", sortOrder: "asc" }
      case "slot_desc":
        return { sortBy: "slotNumber", sortOrder: "desc" }
      case "slot_asc":
      default:
        return { sortBy: "slotNumber", sortOrder: "asc" }
    }
  }, [sortOption])

  const handleClearFilters = () => {
    setSearchQuery("")
    setDebouncedSearchQuery("")
    setStatusFilter("ALL")
    setUsageFilter("ALL")
    setVehicleFilter("ALL")
    setLevelFilter("")
    setDebouncedLevelFilter("")
    setZoneFilter("")
    setDebouncedZoneFilter("")
    setSortOption("slot_asc")
    setPage(1)
  }

  const { data, isLoading } = useParkingSlotsQuery({
    search: debouncedSearchQuery || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    usageType: usageFilter === "ALL" ? undefined : usageFilter,
    vehicleType: vehicleFilter === "ALL" ? undefined : vehicleFilter,
    level: debouncedLevelFilter || undefined,
    zoneCode: debouncedZoneFilter || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  })
  const { data: stats, isLoading: isStatsLoading } = useParkingStatsQuery()
  const totalSlotsCount = stats?.total ?? data?.pagination?.total ?? 0
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL" ||
    usageFilter !== "ALL" ||
    vehicleFilter !== "ALL" ||
    levelFilter.trim().length > 0 ||
    zoneFilter.trim().length > 0 ||
    sortOption !== "slot_asc"

  const availableLevels = useMemo(() => {
    const set = new Set<string>()
    data?.parkingSlots?.forEach((slot) => {
      if (slot.level?.trim()) set.add(slot.level.trim())
    })
    return Array.from(set).sort()
  }, [data?.parkingSlots])

  const availableZones = useMemo(() => {
    const set = new Set<string>()
    data?.parkingSlots?.forEach((slot) => {
      const zone = slot.zoneName?.trim() || slot.zoneCode?.trim()
      if (zone) set.add(zone)
    })
    return Array.from(set).sort()
  }, [data?.parkingSlots])

  return (
    <div className="space-y-7 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Parking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage parking slots, resident vehicle assignments, and availability.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <Sparkles size={16} strokeWidth={2.25} />
            Generate Slots
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38]"
          >
            <Plus size={16} strokeWidth={2.25} />
            Add Slot
          </button>
        </div>
      </div>

      <ParkingSummary stats={stats} isLoading={isStatsLoading} />

      {!isLoading && !isStatsLoading && totalSlotsCount === 0 && !hasActiveFilters && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Car size={32} />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            No parking slots configured
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500">
            No parking slots have been generated for this property yet. Generate
            your first batch of slots now.
          </p>
          <button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38]"
          >
            <Sparkles size={16} />
            Generate Slots Now
          </button>
        </div>
      )}

      {(isLoading || totalSlotsCount > 0 || hasActiveFilters) && (
        <ParkingTable
          slots={data?.parkingSlots ?? []}
          statusFilter={statusFilter}
          usageFilter={usageFilter}
          vehicleFilter={vehicleFilter}
          searchQuery={searchQuery}
          levelFilter={levelFilter}
          zoneFilter={zoneFilter}
          sortOption={sortOption}
          viewMode={viewMode}
          availableLevels={availableLevels}
          availableZones={availableZones}
          isLoading={isLoading}
          page={data?.pagination?.page ?? page}
          totalPages={data?.pagination?.totalPages ?? 1}
          totalCount={data?.pagination?.total ?? 0}
          onSearchChange={setSearchQuery}
          onStatusChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          onUsageChange={(value) => {
            setUsageFilter(value)
            setPage(1)
          }}
          onVehicleChange={(value) => {
            setVehicleFilter(value)
            setPage(1)
          }}
          onLevelChange={(value) => {
            setLevelFilter(value)
            setPage(1)
          }}
          onZoneChange={(value) => {
            setZoneFilter(value)
            setPage(1)
          }}
          onSortChange={(value) => {
            setSortOption(value)
            setPage(1)
          }}
          onViewModeChange={setViewMode}
          onClearFilters={handleClearFilters}
          onPageChange={setPage}
        />
      )}

      <GenerateSlotsDialog
        open={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
      />
    </div>
  )
}
