"use client"

import {
  useSecurityActivity,
  useSecuritySummary,
} from "../hooks/useSecurityData"
import {
  NeedsAttention,
  RecentGateActivity,
  SecuritySummaryCards,
  TodaysVisitorOverview,
} from "./SecurityDashboardSections"
import { SecurityQuickActions } from "./SecurityQuickActions"
import { ErrorState, LoadingState } from "./SecurityUi"

export function SecurityDashboard() {
  const summaryQuery = useSecuritySummary()
  const activityQuery = useSecurityActivity({ limit: 8 })
  const summary = summaryQuery.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">
          Security Dashboard
        </h1>

        <p className="text-sm text-[#637083]">
          Monitor gate visitors, deliveries, parking, and active alerts.
        </p>
      </div>

      {summaryQuery.isLoading ? (
        <LoadingState label="Loading security summary..." />
      ) : summaryQuery.isError ? (
        <ErrorState label="Unable to load security summary." />
      ) : (
        <SecuritySummaryCards summary={summary} />
      )}

      <SecurityQuickActions />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <RecentGateActivity
          activities={activityQuery.data?.activities ?? []}
          isLoading={activityQuery.isLoading}
          isError={activityQuery.isError}
        />

        <NeedsAttention
          summary={summary}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </div>

      {summary ? (
        <TodaysVisitorOverview summary={summary} />
      ) : null}
    </div>
  )
}
