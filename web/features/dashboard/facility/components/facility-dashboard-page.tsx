"use client"

import {
  getApiErrorMessage,
  useFacilityDashboard,
} from "../facility.api"
import { FacilityDashboardActions } from "./dashboard/facility-dashboard-actions"
import { FacilityDashboardStats } from "./dashboard/facility-dashboard-stats"
import { NotificationsPanel } from "./dashboard/notifications-panel"
import { OverdueSchedulesPanel } from "./dashboard/overdue-schedules-panel"
import { PendingActionList } from "./dashboard/pending-action-list"
import { RecentActivityPanel } from "./dashboard/recent-activity-panel"
import {
  ErrorState,
  LoadingRows,
  PageHeader,
} from "./facility-ui"

export default function FacilityDashboardPage() {
  const dashboardQuery = useFacilityDashboard()
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
                "Facility dashboard data could not be loaded."
              )}
              isRetrying={dashboardQuery.isFetching}
              onRetry={() => void dashboardQuery.refetch()}
            />
          </div>
        ) : dashboard && stats ? (
          <>
            <FacilityDashboardStats stats={stats} />

            <div className="mt-6 grid gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <RecentActivityPanel items={dashboard.recentActivity} />
              </div>

              <div className="grid gap-4 xl:col-span-2">
                <NotificationsPanel notifications={dashboard.notifications} />
                <OverdueSchedulesPanel overdue={dashboard.overdue} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-5">
              <PendingActionList
                title="Unassigned Complaints"
                fallbackType="complaint"
                count={dashboard.pendingActions.unassignedComplaints.count}
                items={dashboard.pendingActions.unassignedComplaints.items}
              />
              <PendingActionList
                title="Tasks Waiting Assignment"
                fallbackType="maintenance"
                count={dashboard.pendingActions.tasksWaitingAssignment.count}
                items={dashboard.pendingActions.tasksWaitingAssignment.items}
              />
              <PendingActionList
                title="Work Requiring Review"
                fallbackType="maintenance"
                count={dashboard.pendingActions.workRequiringReview.count}
                items={dashboard.pendingActions.workRequiringReview.items}
              />
              <PendingActionList
                title="Costs Requiring Approval"
                fallbackType="maintenance"
                count={
                  dashboard.pendingActions.submittedCostsRequiringApproval.count
                }
                items={dashboard.pendingActions.submittedCostsRequiringApproval.items}
              />
              <PendingActionList
                title="Resident Confirmations"
                fallbackType="complaint"
                count={
                  dashboard.pendingActions.complaintsWaitingResidentConfirmation
                    .count
                }
                items={
                  dashboard.pendingActions.complaintsWaitingResidentConfirmation
                    .items
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
