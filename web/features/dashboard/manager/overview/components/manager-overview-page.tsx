"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRight,
  Building2,
  Car,
  DoorOpen,
  Megaphone,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  TrendingUp,
  UserPlus,
  UserRound,
  UserRoundCog,
  Users,
  Wrench,
} from "lucide-react"

import {
  useCurrentPropertyApartmentQuery,
  usePropertyBlocksQuery,
  usePropertyStatsQuery,
} from "@/features/dashboard/manager/property/hooks/use-property-query"
import { useUserStatsQuery } from "@/features/dashboard/manager/users/hooks/use-residents-query"
import {
  useManagerActiveVisitorsQuery,
  useManagerVisitorsQuery,
} from "@/features/dashboard/manager/visitors/hooks/useManagerVisitors"
import { useParkingStatsQuery } from "@/features/dashboard/manager/parking/hooks/use-parking-queries"
import { useStaffStatsQuery } from "@/features/dashboard/manager/staff/hooks/use-staff-query"
import {
  useManagerDeliveriesQuery,
  useManagerDeliveryAnalyticsQuery,
} from "@/features/dashboard/manager/deliveries/hooks/useManagerDeliveries"
import { useFinanceSummaryQuery } from "@/features/dashboard/manager/payment-history/hooks/use-payment-history-queries"
import { useAnnouncementsQuery } from "@/features/announcements/hooks/use-announcements-query"

export default function ManagerOverviewPage() {
  const { data: apartment, isLoading: isApartmentLoading } = useCurrentPropertyApartmentQuery()
  const { data: propertyStats, isLoading: isPropertyStatsLoading } =
    usePropertyStatsQuery()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery()
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStatsQuery()
  const { data: visitorRecordsData, isLoading: isVisitorsLoading } =
    useManagerVisitorsQuery({ limit: 5, fetchAll: false })
  const { data: activeVisitorsData } = useManagerActiveVisitorsQuery()
  const { data: parkingStats, isLoading: isParkingLoading } =
    useParkingStatsQuery()
  const { data: staffStats, isLoading: isStaffStatsLoading } =
    useStaffStatsQuery()
  const { data: deliveryAnalytics, isLoading: isDeliveryAnalyticsLoading } =
    useManagerDeliveryAnalyticsQuery("7d")
  const { data: deliveriesData, isLoading: isDeliveriesLoading } =
    useManagerDeliveriesQuery({ page: 1, limit: 5 })
  const { data: financeSummary, isLoading: isFinanceLoading } =
    useFinanceSummaryQuery()
  const { data: announcementsData, isLoading: isAnnouncementsLoading } =
    useAnnouncementsQuery({ page: 1, limit: 3 })

  // Derived metrics from live backend data
  const totalUnits = propertyStats?.totalFlats ?? apartment?.totalUnits ?? 0
  const occupiedUnits = propertyStats?.occupiedFlats ?? 0
  const vacantUnits = propertyStats?.vacantFlats ?? 0
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const activeVisitorsCount = activeVisitorsData?.pagination?.total ?? 0
  const todayVisitorsCount = visitorRecordsData?.pagination?.total ?? 0

  const waitingDeliveries = deliveryAnalytics?.summary?.waiting ?? 0
  const todayDeliveries = deliveryAnalytics?.summary?.total ?? 0

  const parkingTotal = parkingStats?.total ?? 0
  const parkingAvailable = parkingStats?.available ?? 0
  const parkingOccupied = (parkingStats?.occupied ?? 0) + (parkingStats?.assigned ?? 0)
  const parkingRate = parkingTotal > 0 ? Math.round((parkingOccupied / parkingTotal) * 100) : 0
  const totalCollected = financeSummary?.totalCollection ?? 0
  const pendingDues = financeSummary?.totalOutstanding ?? 0
  const totalBilled = totalCollected + pendingDues
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  const recentVisitors = useMemo(() => {
    return visitorRecordsData?.records ?? []
  }, [visitorRecordsData])

  const recentDeliveries = useMemo(() => {
    return deliveriesData?.deliveries ?? []
  }, [deliveriesData])

  const recentAnnouncements = useMemo(() => {
    return announcementsData?.announcements ?? []
  }, [announcementsData])

  return (
    <div className="space-y-6">
      {/* 1. HERO OPERATIONAL HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {isApartmentLoading ? (
              <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            ) : (
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
                {apartment?.name || "Property Overview"}
              </h1>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Real-time management console for unit occupancy, gate security, deliveries, and community services.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/property-manager/users/invite"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#0F5F45] px-3 sm:px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45] focus-visible:ring-offset-2"
          >
            <UserPlus size={15} strokeWidth={2.2} />
            Invite Resident
          </Link>
          <Link
            href="/property-manager/property"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 sm:px-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 focus:outline-none"
          >
            <Building2 size={15} strokeWidth={2.2} />
            Manage Property
          </Link>
          <Link
            href="/property-manager/announcements"
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 sm:px-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 focus:outline-none"
          >
            <Megaphone size={15} strokeWidth={2.2} />
            Post Notice
          </Link>
        </div>
      </div>

      {/* 2. CORE OPERATIONAL METRICS (6 LIVE KPI CARDS) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {/* Metric 1: Units & Occupancy */}
        <Link
          href="/property-manager/property"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Occupancy</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#0F5F45] transition group-hover:bg-[#0F5F45] group-hover:text-white">
              <Building2 size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isPropertyStatsLoading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {occupancyRate}%
                </span>
              )}
              <span className="text-xs font-medium text-slate-500">
                {occupiedUnits}/{totalUnits} units
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0F5F45] transition-all duration-500"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>{vacantUnits} vacant flats</span>
            <span className="font-medium text-[#0F5F45] group-hover:underline">View details</span>
          </div>
        </Link>

        {/* Metric 2: Residents & Community */}
        <Link
          href="/property-manager/users"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Residents</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isUserStatsLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {userStats?.activeUsers ?? 0}
                </span>
              )}
              <span className="text-xs font-medium text-emerald-600">active now</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total registered: {userStats?.totalUsers ?? 0}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>{userStats?.pendingUsers ?? 0} pending invites</span>
            <span className="font-medium text-[#0F5F45] group-hover:underline">Directory</span>
          </div>
        </Link>

        {/* Metric 3: Gate & Visitors */}
        <Link
          href="/property-manager/visitors"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Gate Visitors</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
              <QrCode size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isVisitorsLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {activeVisitorsCount}
                </span>
              )}
              <span className="text-xs font-medium text-indigo-600">on premises</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {todayVisitorsCount} total entries today
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Live check-in log</span>
            <span className="font-medium text-indigo-600 group-hover:underline">Logs</span>
          </div>
        </Link>

        {/* Metric 4: Deliveries & Parcels */}
        <Link
          href="/property-manager/deliveries"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Parcels</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
              <Package size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isDeliveryAnalyticsLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {waitingDeliveries}
                </span>
              )}
              <span className="text-xs font-medium text-amber-600">awaiting pickup</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {todayDeliveries} packages logged
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gate security desk</span>
            <span className="font-medium text-amber-600 group-hover:underline">Parcels</span>
          </div>
        </Link>

        {/* Metric 5: Parking Capacity */}
        <Link
          href="/property-manager/parking"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Parking Slots</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
              <Car size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isParkingLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {parkingAvailable}
                </span>
              )}
              <span className="text-xs font-medium text-slate-500">available</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(parkingRate, 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>{parkingTotal} configured slots</span>
            <span className="font-medium text-teal-700 group-hover:underline">Slots</span>
          </div>
        </Link>

        {/* Metric 6: Maintenance & Staff */}
        <Link
          href="/property-manager/staff"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0F5F45]/40 hover:shadow-xs"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-semibold text-slate-600">Staff On Duty</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition group-hover:bg-sky-700 group-hover:text-white">
              <UserRoundCog size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {isStaffStatsLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {staffStats?.activeStaff ?? 0}
                </span>
              )}
              <span className="text-xs font-medium text-sky-700">active staff</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {staffStats?.totalStaff ?? 0} team members
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Security & Maintenance</span>
            <span className="font-medium text-sky-700 group-hover:underline">Roster</span>
          </div>
        </Link>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (2 COLUMN GRID) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: BLOCKS OVERVIEW + RECENT ACTIVITY (8 COLS) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card A: Blocks and Units Status */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Building Blocks & Units
                </h2>
                <p className="text-xs text-slate-500">
                  Apartment architecture breakdown and floor allocations.
                </p>
              </div>
              <Link
                href="/property-manager/property"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                Manage all
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-5">
              {isBlocksLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-50"
                    />
                  ))}
                </div>
              ) : blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
                  <Building2 className="size-9 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    No building blocks configured
                  </p>
                  <p className="mt-0.5 max-w-xs text-xs text-slate-500">
                    Add your building blocks and floors to start generating flat numbers.
                  </p>
                  <Link
                    href="/property-manager/property"
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0F5F45] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#0B4D38]"
                  >
                    <Plus size={14} />
                    Add First Block
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {blocks.slice(0, 6).map((block) => (
                    <div
                      key={block.id}
                      className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-white hover:border-slate-300 hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block rounded bg-white px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider text-slate-700 ring-1 ring-slate-200">
                            {block.code}
                          </span>
                          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
                            {block.blockname}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            block.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {block.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-xs text-slate-500">
                        <span>{block.totalFloors} Floors</span>
                        <Link
                          href="/property-manager/property"
                          className="font-medium text-[#0F5F45] hover:underline"
                        >
                          View Flats →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card B: Live Gate Activity (Visitors) */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Gate & Visitor Activity
                </h2>
                <p className="text-xs text-slate-500">
                  Latest guest check-ins and gate entries recorded today.
                </p>
              </div>
              <Link
                href="/property-manager/visitors"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                Full Visitor Log
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {isVisitorsLoading ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded bg-slate-50"
                    />
                  ))}
                </div>
              ) : recentVisitors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No gate entries recorded today.
                </div>
              ) : (
                recentVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700">
                        {visitor.visitorName ? (
                          visitor.visitorName.charAt(0).toUpperCase()
                        ) : (
                          <UserRound size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {visitor.visitorName || "Guest"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {visitor.flatNumber ? `Visiting Flat ${visitor.flatNumber}` : ""}
                          {visitor.flatNumber && visitor.purpose ? " • " : ""}
                          {visitor.purpose || ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          visitor.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {visitor.status === "ACTIVE" ? "Inside" : "Checked Out"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {visitor.checkedInAt
                          ? new Date(visitor.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card C: Incoming Deliveries at Security */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Parcels & Deliveries Awaiting Pickup
                </h2>
                <p className="text-xs text-slate-500">
                  Courier deliveries received at the gate awaiting resident collection.
                </p>
              </div>
              <Link
                href="/property-manager/deliveries"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                All Parcels
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {isDeliveriesLoading ? (
                <div className="space-y-3 p-5">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded bg-slate-50"
                    />
                  ))}
                </div>
              ) : recentDeliveries.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No packages currently waiting for collection.
                </div>
              ) : (
                recentDeliveries.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {pkg.deliveryCompany}
                          {pkg.flatNumber ? ` • Unit ${pkg.flatNumber}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {pkg.packageDescription || pkg.deliveryType}
                          {pkg.residentName ? ` • Resident: ${pkg.residentName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
                        {pkg.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {pkg.receivedAt
                          ? new Date(pkg.receivedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK SHORTCUTS, ANNOUNCEMENTS, MAINTENANCE (4 COLS) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Quick Shortcuts Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900">
              Management Shortcuts
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Fast navigation to key operations.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/property-manager/users/invite"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-[#0F5F45] group-hover:bg-[#0F5F45] group-hover:text-white transition">
                  <UserPlus size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Invite User
                </span>
              </Link>

              <Link
                href="/property-manager/property"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
                  <DoorOpen size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Flats & Units
                </span>
              </Link>

              <Link
                href="/property-manager/parking"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
                  <Car size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Parking
                </span>
              </Link>

              <Link
                href="/property-manager/payment-history"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-violet-50 text-violet-700 group-hover:bg-violet-700 group-hover:text-white transition">
                  <ReceiptText size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Payments
                </span>
              </Link>

              <Link
                href="/property-manager/maintenance"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition">
                  <Wrench size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Maintenance
                </span>
              </Link>

              <Link
                href="/property-manager/announcements"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-emerald-50/30 group"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-700 group-hover:bg-rose-700 group-hover:text-white transition">
                  <Megaphone size={16} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Broadcasts
                </span>
              </Link>
            </div>
          </div>

          {/* Community Announcements Snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Notices & Broadcasts
                </h2>
                <p className="text-xs text-slate-500">
                  Recent messages sent to residents.
                </p>
              </div>
              <Link
                href="/property-manager/announcements"
                className="text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {isAnnouncementsLoading ? (
                <div className="space-y-2.5">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-slate-50"
                    />
                  ))}
                </div>
              ) : recentAnnouncements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                  No announcements published yet.
                </div>
              ) : (
                recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-white hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-2xs">
                        {ann.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ann.createdAt
                          ? new Date(ann.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-xs font-semibold text-slate-900 line-clamp-1">
                      {ann.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                      {ann.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/property-manager/announcements"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Megaphone size={14} />
              Create Announcement
            </Link>
          </div>

          {/* Financial Dues & Collection Health Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Financial Health
              </span>
              {totalBilled > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp size={14} />
                  {collectionRate}% Collected
                </span>
              )}
            </div>

            <div className="mt-3">
              {isFinanceLoading ? (
                <div className="h-16 animate-pulse rounded bg-slate-50" />
              ) : totalBilled === 0 && totalCollected === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                  No payment bills or dues recorded yet.
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Total Collected</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      ₹{Number(totalCollected).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Pending Dues</span>
                    <span className="text-sm font-semibold text-rose-600 tabular-nums">
                      ₹{Number(pendingDues).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(collectionRate, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <Link
              href="/property-manager/payment-history"
              className="mt-4 flex items-center justify-between text-xs font-semibold text-[#0F5F45] hover:underline"
            >
              <span>View ledger & dues</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
