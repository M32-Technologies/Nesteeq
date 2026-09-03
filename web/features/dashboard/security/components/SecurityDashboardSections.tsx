"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  BellRing,
  Car,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Package,
  ParkingCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type {
  SecurityActivity,
  SecurityActivityType,
  SecuritySummary,
} from "../services/security.interface"
import {
  StatusBadge,
  outlineButtonClassName,
  panelClassName,
} from "./SecurityUi"

const activityIconMap: Record<
  SecurityActivityType,
  LucideIcon
> = {
  VISITOR_CHECKED_IN: LogIn,
  VISITOR_CHECKED_OUT: LogOut,
  VISITOR_MANUAL_REGISTERED: QrCode,
  DELIVERY_RECEIVED: Package,
  DELIVERY_NOTIFIED: BellRing,
  DELIVERY_COLLECTED: CheckCircle2,
  DELIVERY_RETURNED: LogOut,
  PARKING_ASSIGNED: ParkingCircle,
  PARKING_RELEASED: Car,
  SOS_TRIGGERED: ShieldAlert,
  SOS_ACKNOWLEDGED: BellRing,
  SOS_RESPONDING: ShieldCheck,
  SOS_RESOLVED: CheckCircle2,
}

export function SecuritySummaryCards({
  summary,
}: {
  summary?: SecuritySummary
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Visitors Currently Inside"
        value={summary?.visitorsInside ?? 0}
        icon={<QrCode className="h-5 w-5" />}
      />
      <SummaryCard
        label="Upcoming Visitors"
        value={summary?.upcomingVisitors ?? 0}
        icon={<BellRing className="h-5 w-5" />}
      />
      <SummaryCard
        label="Deliveries Waiting"
        value={summary?.deliveriesWaiting ?? 0}
        icon={<Package className="h-5 w-5" />}
      />
      <SummaryCard
        label="Available Visitor Parking"
        value={summary?.availableVisitorParking ?? 0}
        icon={<Car className="h-5 w-5" />}
      />
      <SummaryCard
        label="Active SOS Alerts"
        value={summary?.activeSosAlerts ?? 0}
        icon={<ShieldAlert className="h-5 w-5" />}
        urgent={(summary?.activeSosAlerts ?? 0) > 0}
      />
    </div>
  )
}

export function RecentGateActivity({
  activities,
  isLoading,
  isError,
}: {
  activities: SecurityActivity[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section className={panelClassName}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#111111]">
            Recent Gate Activity
          </h2>
          <p className="mt-1 text-sm text-[#637083]">
            Latest visitor, delivery, parking, and SOS updates.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-sm text-[#637083]">
            Loading recent gate activity...
          </p>
        ) : isError ? (
          <p className="text-sm text-red-700">
            Unable to load recent gate activity.
          </p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-[#637083]">
            No recent gate activity.
          </p>
        ) : (
          activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
            />
          ))
        )}
      </div>
    </section>
  )
}

export function NeedsAttention({
  summary,
  isLoading,
  isError,
}: {
  summary?: SecuritySummary
  isLoading: boolean
  isError: boolean
}) {
  const attentionItems = summary
    ? getAttentionItems(summary)
    : []

  return (
    <section className={panelClassName}>
      <h2 className="text-base font-semibold text-[#111111]">
        Needs Attention
      </h2>
      <p className="mt-1 text-sm text-[#637083]">
        Action-focused items for gate staff.
      </p>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-sm text-[#637083]">
            Loading attention items...
          </p>
        ) : isError ? (
          <p className="text-sm text-red-700">
            Unable to load attention items.
          </p>
        ) : attentionItems.length === 0 ? (
          <p className="text-sm text-[#637083]">
            No items need immediate attention.
          </p>
        ) : (
          attentionItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`block rounded-lg border p-3 transition hover:bg-[#F7F8F5] ${
                item.urgent
                  ? "border-red-200 bg-red-50/60"
                  : "border-[#EEF1F4] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`font-semibold ${
                      item.urgent
                        ? "text-red-700"
                        : "text-[#111111]"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[#637083]">
                    {item.description}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

export function TodaysVisitorOverview({
  summary,
}: {
  summary: SecuritySummary
}) {
  return (
    <section className={panelClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#111111]">
            Today&apos;s Visitor Overview
          </h2>
          <p className="mt-1 text-sm text-[#637083]">
            Compact count of today&apos;s visitor movement.
          </p>
        </div>

        <Link
          href="/security/visitors"
          className={outlineButtonClassName}
        >
          View Visitors
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <OverviewMetric
          label="Upcoming Today"
          value={summary.upcomingVisitorsToday}
          status="UPCOMING"
        />
        <OverviewMetric
          label="Checked In Today"
          value={summary.checkedInToday}
          status="ACTIVE"
        />
        <OverviewMetric
          label="Checked Out Today"
          value={summary.checkedOutToday}
          status="EXITED"
        />
      </div>
    </section>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  urgent = false,
}: {
  label: string
  value: number
  icon: ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        urgent ? "border-red-200" : "border-[#DDE3DF]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-[#637083]">
          {label}
        </p>
        <span
          className={
            urgent ? "text-red-600" : "text-[#07584F]"
          }
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold text-[#111111]">
        {value}
      </p>
    </div>
  )
}

function ActivityRow({
  activity,
}: {
  activity: SecurityActivity
}) {
  const Icon = activityIconMap[activity.type]

  return (
    <div className="grid gap-3 rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-[#637083]">
        <Clock className="h-4 w-4" />
        {formatActivityTime(activity.timestamp)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[#07584F]" />
          <p className="truncate font-semibold text-[#111111]">
            {activity.title}
          </p>
        </div>
        <p className="mt-1 truncate text-sm text-[#637083]">
          {activity.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={activity.status} />
        <Link
          href={activity.href}
          className={outlineButtonClassName}
        >
          {activity.actionLabel}
        </Link>
      </div>
    </div>
  )
}

function OverviewMetric({
  label,
  value,
  status,
}: {
  label: string
  value: number
  status: string
}) {
  return (
    <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#637083]">
          {label}
        </p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#111111]">
        {value}
      </p>
    </div>
  )
}

function getAttentionItems(summary: SecuritySummary) {
  const parkingIssues =
    summary.occupiedVisitorParking +
    summary.reservedVisitorParking +
    summary.outOfServiceVisitorParking

  return [
    summary.activeSosAlerts > 0
      ? {
          title: `${summary.activeSosAlerts} Active SOS Alerts`,
          description: "Emergency alerts need immediate response.",
          status: "ACTIVE",
          href: "/security/alerts",
          urgent: true,
        }
      : null,
    summary.deliveriesWaiting > 0
      ? {
          title: `${summary.deliveriesWaiting} Parcels Waiting`,
          description: "Deliveries are waiting at the gate.",
          status: "WAITING",
          href: "/security/deliveries",
          urgent: false,
        }
      : null,
    summary.upcomingVisitorsToday > 0
      ? {
          title: `${summary.upcomingVisitorsToday} Upcoming Visitors Today`,
          description: "Pre-approved visitors are expected today.",
          status: "UPCOMING",
          href: "/security/visitors",
          urgent: false,
        }
      : null,
    parkingIssues > 0
      ? {
          title: "Parking Attention",
          description: [
            `${summary.occupiedVisitorParking} occupied`,
            `${summary.reservedVisitorParking} reserved`,
            `${summary.outOfServiceVisitorParking} unavailable`,
          ].join(", "),
          status: "OCCUPIED",
          href: "/security/parking",
          urgent: false,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> =>
    Boolean(item)
  )
}

function formatActivityTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}
