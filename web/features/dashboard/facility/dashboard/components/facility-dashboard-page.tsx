"use client"

import { useFacilityDashboardQuery } from "@/features/dashboard/facility/dashboard/hooks/use-dashboard-queries"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import { FacilityDashboardActions } from "@/features/dashboard/facility/dashboard/components/facility-dashboard-actions"
import { FacilityDashboardStats } from "@/features/dashboard/facility/dashboard/components/facility-dashboard-stats"
import { NotificationsPanel } from "@/features/dashboard/facility/dashboard/components/notifications-panel"
import { OverdueSchedulesPanel } from "@/features/dashboard/facility/dashboard/components/overdue-schedules-panel"
import { PendingActionList } from "@/features/dashboard/facility/dashboard/components/pending-action-list"
import { RecentActivityPanel } from "@/features/dashboard/facility/dashboard/components/recent-activity-panel"
import {
  ErrorState,
  LoadingRows,
  PageHeader,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function FacilityDashboardPage() {
  const dashboardQuery = useFacilityDashboardQuery()
  const dashboard = dashboardQuery.data
  const stats = dashboard?.stats

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader
          title="Facility Manager Dashboard"
          eyebrow="Operations"
          actions={<FacilityDashboardActions />}
        />

        {dashboardQuery.isPending ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
            <LoadingRows rows={8} />
          </div>
        ) : dashboardQuery.isError ? (
          <div className="mt-6 rounded-lg border border-[#E2E8EE] bg-white">
            <ErrorState
              title="Unable to load dashboard"
              message={getApiErrorMessage(
                dashboardQuery.error,
                "The facility dashboard could not be loaded."
              )}
              isRetrying={dashboardQuery.isFetching}
              onRetry={() => void dashboardQuery.refetch()}
            />
          </div>
        ) : dashboard ? (
          <div className="mt-6 space-y-6">
            <FacilityDashboardStats stats={stats} />

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <PendingActionList pendingActions={dashboard.pendingActions} />
                <OverdueSchedulesPanel
                  schedules={dashboard.overdueSchedules}
                />
              </div>

              <div className="space-y-6">
                <NotificationsPanel />
                <RecentActivityPanel
                  activities={dashboard.recentActivities}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FacilityDashboardPage
