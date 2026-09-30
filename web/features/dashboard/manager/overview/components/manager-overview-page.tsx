"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Car,
  Clock,
  DoorOpen,
  Layers,
  Megaphone,
  Package,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  UserRoundCog,
  Users,
  Wrench,
  type LucideIcon,
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
  const [greeting, setGreeting] = useState("Welcome back")
  const [activityTab, setActivityTab] = useState<"visitors" | "deliveries">("visitors")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  // Live Backend Data Queries
  const { data: apartment, isLoading: isApartmentLoading } =
    useCurrentPropertyApartmentQuery()
  const { data: propertyStats, isLoading: isPropertyStatsLoading } =
    usePropertyStatsQuery()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery()
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStatsQuery()
  const { data: visitorRecordsData, isLoading: isVisitorsLoading } =
    useManagerVisitorsQuery({ limit: 6, fetchAll: false })
  const { data: activeVisitorsData } = useManagerActiveVisitorsQuery()
  const { data: parkingStats, isLoading: isParkingLoading } =
    useParkingStatsQuery()
  const { data: staffStats, isLoading: isStaffStatsLoading } =
    useStaffStatsQuery()
  const { data: deliveryAnalytics, isLoading: isDeliveryAnalyticsLoading } =
    useManagerDeliveryAnalyticsQuery("7d")
  const { data: deliveriesData, isLoading: isDeliveriesLoading } =
    useManagerDeliveriesQuery({ page: 1, limit: 6 })
  const { data: financeSummary, isLoading: isFinanceLoading } =
    useFinanceSummaryQuery()
  const { data: announcementsData, isLoading: isAnnouncementsLoading } =
    useAnnouncementsQuery({ page: 1, limit: 3 })

  // Derived metrics from live queries
  const totalUnits = propertyStats?.totalFlats ?? apartment?.totalUnits ?? 0
  const occupiedUnits = propertyStats?.occupiedFlats ?? 0
  const vacantUnits = propertyStats?.vacantFlats ?? 0
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const activeVisitorsCount = activeVisitorsData?.pagination?.total ?? 0
  const todayVisitorsCount = visitorRecordsData?.pagination?.total ?? 0

  const waitingDeliveries = deliveryAnalytics?.summary?.waiting ?? 0
  const todayDeliveries = deliveryAnalytics?.summary?.total ?? 0

  const parkingTotal = parkingStats?.total ?? 0
  const parkingAvailable = parkingStats?.available ?? 0
  const parkingOccupied =
    (parkingStats?.occupied ?? 0) + (parkingStats?.assigned ?? 0)
  const parkingRate =
    parkingTotal > 0 ? Math.round((parkingOccupied / parkingTotal) * 100) : 0

  const totalCollected = financeSummary?.totalCollection ?? 0
  const pendingDues = financeSummary?.totalOutstanding ?? 0
  const totalBilled = totalCollected + pendingDues
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  const recentVisitors = useMemo(() => {
    return visitorRecordsData?.records ?? []
  }, [visitorRecordsData])

  const recentDeliveries = useMemo(() => {
    return deliveriesData?.deliveries ?? []
  }, [deliveriesData])

  const recentAnnouncements = useMemo(() => {
    return announcementsData?.announcements ?? []
  }, [announcementsData])

  // Standard Nesteeq KPI card data matching PropertyHeader & ParkingSummary
  const statCards: {
    title: string
    value: string | number
    description: string
    icon: LucideIcon
    accent: string
    iconBg: string
    iconColor: string
    isLoading: boolean
  }[] = [
    {
      title: "Total Occupancy",
      value: `${occupancyRate}%`,
      description: `${occupiedUnits} occupied / ${vacantUnits} vacant`,
      icon: DoorOpen,
      accent: "bg-[#0F5F45]",
      iconBg: "bg-[#E7F4EE]",
      iconColor: "text-[#0F5F45]",
      isLoading: isPropertyStatsLoading || isApartmentLoading,
    },
    {
      title: "Total Residents",
      value: userStats?.totalUsers ?? 0,
      description: `${userStats?.activeUsers ?? 0} active / ${userStats?.pendingUsers ?? 0} pending`,
      icon: Users,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      isLoading: isUserStatsLoading,
    },
    {
      title: "Gate Visitors",
      value: todayVisitorsCount,
      description: `${activeVisitorsCount} currently inside`,
      icon: ShieldCheck,
      accent: "bg-indigo-600",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-700",
      isLoading: isVisitorsLoading,
    },
    {
      title: "Parcels & Deliveries",
      value: todayDeliveries,
      description: `${waitingDeliveries} awaiting pickup`,
      icon: Package,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      isLoading: isDeliveryAnalyticsLoading || isDeliveriesLoading,
    },
    {
      title: "Parking Allocation",
      value: `${parkingRate}%`,
      description: `${parkingAvailable} available / ${parkingTotal} total`,
      icon: Car,
      accent: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
      isLoading: isParkingLoading,
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Standard Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
              Overview
            </h1>
            {apartment?.name && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E7F4EE] px-2.5 py-1 text-xs font-semibold text-[#0F5F45] border border-[#0F5F45]/20">
                <span className="size-1.5 rounded-full bg-[#0F5F45]" />
                {apartment.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {greeting}. Here is your society overview, occupancy metrics, and security feed.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/property-manager/property"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45]"
          >
            <Building2 size={16} strokeWidth={2.25} />
            <span>Manage Flats</span>
          </Link>

          <Link
            href="/property-manager/users/invite"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45]"
          >
            <UserPlus size={16} strokeWidth={2.25} />
            <span>Invite Resident</span>
          </Link>
        </div>
      </div>

      {/* 2. Standard 5-Column KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:shadow-sm"
            >
              {/* Left 3px brand accent stripe */}
              <span
                className={`absolute inset-y-0 left-0 w-[3px] ${card.accent}`}
              />

              <div className="flex items-start justify-between pl-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-700">
                    {card.title}
                  </p>
                  <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                    {card.isLoading ? (
                      <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100 align-middle" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
              </div>

              <p className="mt-2.5 pl-2 text-xs font-medium text-slate-500">
                {card.isLoading ? (
                  <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-slate-100" />
                ) : (
                  card.description
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* 3. Main Dashboard Layout Grid (8 Cols Left / 4 Cols Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Blocks & Live Security Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card A: Building Blocks & Architectural Overview */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Building Blocks
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tower structures and flat occupancy status.
                </p>
              </div>

              <Link
                href="/property-manager/property"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] transition"
              >
                <span>View all flats</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-5">
              {isBlocksLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg bg-slate-50 border border-slate-100"
                    />
                  ))}
                </div>
              ) : blocks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                  <Building2 className="mx-auto size-8 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    No building blocks created yet
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Set up your first block to start assigning flats.
                  </p>
                  <Link
                    href="/property-manager/property"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0F5F45] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0B4D38]"
                  >
                    <Plus size={14} />
                    Add Block
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="group flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-[#0F5F45] hover:shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {block.code || "BLK"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                              block.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {block.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-[#0F5F45] transition-colors">
                          {block.blockname}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {block.totalFloors} {block.totalFloors === 1 ? "Floor" : "Floors"}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Residential Unit
                        </span>
                        <Link
                          href={`/property-manager/property?tab=flats&blockId=${block.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] transition group-hover:translate-x-0.5"
                        >
                          <span>Manage</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card B: Live Gate Security & Parcel Activity */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Gate & Access Activity
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Real-time visitor logs and incoming package deliveries.
                </p>
              </div>

              {/* Standard tab switch */}
              <div className="flex items-center rounded-lg bg-slate-100 p-1 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setActivityTab("visitors")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    activityTab === "visitors"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Visitors ({todayVisitorsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab("deliveries")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    activityTab === "deliveries"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Parcels ({todayDeliveries})
                </button>
              </div>
            </div>

            {/* Tab 1: Visitors Feed */}
            {activityTab === "visitors" && (
              <div>
                {isVisitorsLoading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-lg bg-slate-50"
                      />
                    ))}
                  </div>
                ) : recentVisitors.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <ShieldCheck className="mx-auto size-7 text-slate-300 mb-1.5" />
                    No visitors logged for today yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Visitor</th>
                          <th className="py-3 px-4">Purpose</th>
                          <th className="py-3 px-4">Destination</th>
                          <th className="py-3 px-4">Check-in</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentVisitors.map((visitor) => (
                          <tr
                            key={visitor.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">
                                {visitor.visitorName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {visitor.visitorPhone || "No contact"}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {visitor.purpose || "Visitor"}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">
                                {visitor.flatNumber ? `Flat ${visitor.flatNumber}` : "Main Gate"}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-500 tabular-nums">
                              {visitor.checkedInAt
                                ? new Date(visitor.checkedInAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                                  visitor.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                    : visitor.status === "EXPECTED"
                                    ? "bg-sky-50 text-sky-700 border-sky-200/70"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                <span className="size-1 rounded-full bg-current" />
                                {visitor.status === "ACTIVE"
                                  ? "Inside"
                                  : visitor.status === "EXPECTED"
                                  ? "Expected"
                                  : "Exited"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/40 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Showing latest registered gate entries
                  </span>
                  <Link
                    href="/property-manager/visitors"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] transition"
                  >
                    <span>Full visitor log</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 2: Parcels Feed */}
            {activityTab === "deliveries" && (
              <div>
                {isDeliveriesLoading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-lg bg-slate-50"
                      />
                    ))}
                  </div>
                ) : recentDeliveries.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <Package className="mx-auto size-7 text-slate-300 mb-1.5" />
                    No parcels or deliveries recorded today.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Courier</th>
                          <th className="py-3 px-4">Recipient Flat</th>
                          <th className="py-3 px-4">Received</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentDeliveries.map((delivery) => (
                          <tr
                            key={delivery.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">
                                {delivery.deliveryCompany}
                              </p>
                              <p className="text-[11px] text-slate-400 capitalize">
                                {delivery.deliveryType}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">
                                Flat {delivery.flatNumber}
                              </span>
                              {delivery.residentName && (
                                <p className="text-[11px] text-slate-400">
                                  {delivery.residentName}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-4 text-slate-500 tabular-nums">
                              {delivery.receivedAt
                                ? new Date(delivery.receivedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                                  delivery.status === "WAITING" || delivery.status === "NOTIFIED"
                                    ? "bg-amber-50 text-amber-700 border-amber-200/70"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                }`}
                              >
                                <span className="size-1 rounded-full bg-current" />
                                {delivery.status === "WAITING" || delivery.status === "NOTIFIED"
                                  ? "Awaiting Pickup"
                                  : "Collected"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/40 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Live delivery telemetry from security gate
                  </span>
                  <Link
                    href="/property-manager/deliveries"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] transition"
                  >
                    <span>View all deliveries</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Finance, Operations Shortcuts & Notices */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Financial Health & Collections */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Financial Health
              </span>
              {totalBilled > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  <TrendingUp size={13} />
                  {collectionRate}% Collected
                </span>
              )}
            </div>

            <div className="mt-3.5">
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
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      ₹{Number(totalCollected).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Pending Dues</span>
                    <span className="text-xs font-semibold text-amber-700 tabular-nums">
                      ₹{Number(pendingDues).toLocaleString()}
                    </span>
                  </div>

                  {/* Clean progress bar */}
                  <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
                    <div
                      className="h-full bg-[#0F5F45] transition-all duration-500"
                      style={{ width: `${Math.min(collectionRate, 100)}%` }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - collectionRate)}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <Link
              href="/property-manager/payment-history"
              className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] transition"
            >
              <span>View ledger & dues</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Card 2: Operations Shortcuts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Operations Shortcuts
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Direct access to society management tools.
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <Link
                href="/property-manager/users/invite"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45] group-hover:bg-[#0F5F45] group-hover:text-white transition-colors">
                  <UserPlus size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Invite User
                </span>
              </Link>

              <Link
                href="/property-manager/property"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                  <DoorOpen size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Flats & Units
                </span>
              </Link>

              <Link
                href="/property-manager/parking"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                  <Car size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Parking
                </span>
              </Link>

              <Link
                href="/property-manager/maintenance"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <Wrench size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Maintenance
                </span>
              </Link>

              <Link
                href="/property-manager/staff"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <UserRoundCog size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Staff Roster
                </span>
              </Link>

              <Link
                href="/property-manager/announcements"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-3 text-center transition hover:border-[#0F5F45] hover:bg-[#E7F4EE]/20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-700 group-hover:text-white transition-colors">
                  <Megaphone size={16} strokeWidth={2} />
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-800">
                  Broadcasts
                </span>
              </Link>
            </div>
          </div>

          {/* Card 3: Notices & Community Broadcasts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Notices & Broadcasts
                </h2>
                <p className="text-xs text-slate-500">Resident bulletins</p>
              </div>

              <Link
                href="/property-manager/announcements"
                className="text-xs font-semibold text-[#0F5F45] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {isAnnouncementsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-slate-50"
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
                    className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-white hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200 shadow-2xs">
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
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99]"
            >
              <Megaphone size={14} />
              Create Announcement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
