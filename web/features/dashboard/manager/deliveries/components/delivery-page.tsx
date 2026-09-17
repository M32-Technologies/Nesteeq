"use client"

import { useMemo, useState } from "react"
import DeliveryStatsCards from "./delivery-stats-cards"
import DeliveryActivityChart from "./delivery-activity-chart"
import DeliveryInsightsCard from "./delivery-insights-card"
import DeliveryTableSection from "./delivery-table-section"
import DeliveryDetailsModal from "./delivery-details-modal"
import type { DateRangeValue } from "./delivery-date-range-picker"
import type {
  DeliveryAnalyticsRange,
  DeliveryRecord,
} from "../types/deliveries"
import {
  useManagerDeliveriesQuery,
  useManagerDeliveryAnalyticsQuery,
} from "../hooks/useManagerDeliveries"

export default function DeliveryPage() {
  // Chart range state
  const [chartRange, setChartRange] = useState<DeliveryAnalyticsRange>("7d")

  // Table filter states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: null,
    endDate: null,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Details Modal state
  const [selectedRecord, setSelectedRecord] = useState<DeliveryRecord | null>(
    null
  )

  // API Queries
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    useManagerDeliveryAnalyticsQuery(chartRange)

  const deliveriesParams = useMemo(() => {
    return {
      page,
      limit: pageSize,
      status: statusFilter,
      deliveryType: typeFilter,
      search: search.trim() || undefined,
      startDate: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
      endDate: dateRange.endDate ? dateRange.endDate.toISOString() : undefined,
    }
  }, [page, pageSize, statusFilter, typeFilter, search, dateRange])

  const { data: deliveriesData, isLoading: isDeliveriesLoading } =
    useManagerDeliveriesQuery(deliveriesParams)

  const records = deliveriesData?.deliveries ?? []
  const totalRecords = deliveriesData?.pagination?.total ?? 0

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
          Delivery & Parcels
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track incoming packages, monitor gate activity, and analyze resident collection rates.
        </p>
      </div>

      {/* 1. Summary Stats Cards (Compact, aligned with Visitor Page cards) */}
      <DeliveryStatsCards
        stats={analyticsData?.summary}
        isLoading={isAnalyticsLoading}
      />

      {/* 2. Activity Graph + Right Side Courier & Gate Insights */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 items-stretch">
        <div className="xl:col-span-2">
          <DeliveryActivityChart
            activity={analyticsData?.activity}
            range={chartRange}
            onRangeChange={setChartRange}
            isLoading={isAnalyticsLoading}
          />
        </div>

        <div className="xl:col-span-1">
          <DeliveryInsightsCard
            stats={analyticsData?.summary}
            deliveries={records}
            isLoading={isAnalyticsLoading}
          />
        </div>
      </div>

      {/* 3. Table Section with Presets Datepicker Modal (Image 1) */}
      <DeliveryTableSection
        records={records}
        totalRecords={totalRecords}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        search={search}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s)
          setPage(1)
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(t) => {
          setTypeFilter(t)
          setPage(1)
        }}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r)
          setPage(1)
        }}
        isLoading={isDeliveriesLoading}
        onViewRecord={(rec) => setSelectedRecord(rec)}
      />

      {/* 4. Detailed Delivery Modal (Opens on row click anywhere in the table) */}
      <DeliveryDetailsModal
        delivery={selectedRecord}
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  )
}
