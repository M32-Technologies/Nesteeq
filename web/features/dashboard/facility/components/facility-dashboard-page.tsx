"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Hammer,
  Inbox,
  Timer,
  UserRoundCog,
  WalletCards,
  Wrench,
} from "lucide-react"

import {
  getApiErrorMessage,
  useFacilityDashboard,
} from "../facility.api"
import {
  priorities,
  type FacilityActivityItem,
  type FacilityDashboardWorkItem,
  type FacilityNotificationItem,
  type Priority,
} from "../facility.types"
import {
  EmptyState,
  ErrorState,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  LoadingRows,
  MetricCard,
  PageHeader,
  PriorityBadge,
  StatusBadge,
} from "./facility-ui"

const activityLabels: Record<FacilityActivityItem["type"], string> = {
  NEW_COMPLAINT: "New complaint",
  TECHNICIAN_UPDATE: "Technician update",
  WORK_COMPLETED: "Completed work",
  COST_SUBMITTED: "Cost submission",
  RESIDENT_CONFIRMATION: "Resident confirmation",
}

function isPriority(value?: string | null): value is Priority {
  return (priorities as readonly string[]).includes(value ?? "")
}

function getItemHref(item: FacilityDashboardWorkItem, fallback: "complaint" | "maintenance") {
  const type = item.type ?? fallback
  return type === "maintenance"
    ? "/facility-manager/maintenance"
    : "/facility-manager/complaints"
}

function PendingActionList({
  title,
  fallbackType,
  count,
  items,
}: {
  title: string
  fallbackType: "complaint" | "maintenance"
  count: number
  items: FacilityDashboardWorkItem[]
}) {
  return (
    <section className="rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] px-4 py-4">
        <h2 className="text-[15px] font-semibold text-[#111111]">{title}</h2>
        <span className="rounded-md bg-[#EEF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#2E639B]">
          {count}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-5 text-[13px] text-[#66737F]">No pending items.</div>
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {items.map((item) => (
            <Link
              key={`${title}-${item.id}`}
              href={getItemHref(item, fallbackType)}
              className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#07584F]">
                    {formatId(item.id)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">
                    {item.title}
                  </p>
                  {item.submittedAmount !== undefined ? (
                    <p className="mt-1 text-[12px] text-[#66737F]">
                      {formatCurrency(item.submittedAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  {isPriority(item.priority) ? (
                    <PriorityBadge priority={item.priority} />
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function ActivityRow({ item }: { item: FacilityActivityItem }) {
  return (
    <Link
      href={
        item.resourceType === "maintenance"
          ? "/facility-manager/maintenance"
          : "/facility-manager/complaints"
      }
      className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#07584F]">
            {activityLabels[item.type]}
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">
            {item.description}
          </p>
          <p className="mt-1 text-[12px] text-[#66737F]">
            {formatLabel(item.resourceType)} {formatId(item.resourceId)}
          </p>
        </div>
        <div className="shrink-0 text-right text-[12px] text-[#66737F]">
          {formatDate(item.occurredAt)}
        </div>
      </div>
    </Link>
  )
}

function NotificationRow({ item }: { item: FacilityNotificationItem }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#111111]">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
            {item.message}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-[#F3F5F7] px-2 py-1 text-[11px] font-semibold text-[#687481]">
          {formatLabel(item.severity)}
        </span>
      </div>
      <p className="mt-2 text-[12px] text-[#8793A0]">{formatDate(item.createdAt)}</p>
    </div>
  )
}

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
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/facility-manager/complaints"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE5EC] bg-white px-4 text-[13px] font-semibold text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
              >
                <ClipboardList className="size-4" />
                Complaints
              </Link>
              <Link
                href="/facility-manager/maintenance"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064C44]"
              >
                <Wrench className="size-4" />
                Maintenance
              </Link>
            </div>
          }
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
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Open Complaints" value={stats.openComplaints} icon={ClipboardList} tone="green" />
              <MetricCard title="Pending Maintenance Requests" value={stats.pendingMaintenanceRequests} icon={Timer} tone="amber" />
              <MetricCard title="Assigned Tasks" value={stats.assignedTasks} icon={UserRoundCog} tone="blue" />
              <MetricCard title="In-Progress Tasks" value={stats.inProgressTasks} icon={Gauge} tone="green" />
              <MetricCard title="Completed Tasks" value={stats.completedTasks} icon={CheckCircle2} tone="gray" />
              <MetricCard title="Overdue Tasks" value={stats.overdueTasks} icon={AlertTriangle} tone="rose" />
              <MetricCard title="Pending Approvals" value={stats.pendingApprovals} icon={WalletCards} tone="amber" />
              <MetricCard title="Technicians" value={stats.technicians} icon={Hammer} tone="blue" />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-4">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#111111]">
                        Recent Activity
                      </h2>
                      <p className="mt-1 text-[12px] text-[#66737F]">
                        Complaints, technician updates, completed work, costs, and confirmations
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-[#8793A0]" />
                  </div>

                  {dashboard.recentActivity.length === 0 ? (
                    <EmptyState
                      title="No recent activity"
                      message="Operational activity will appear here as work moves through the system."
                    />
                  ) : (
                    <div className="divide-y divide-[#EEF2F5]">
                      {dashboard.recentActivity.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-4 xl:col-span-2">
                <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-[#07584F]" />
                      <h2 className="text-[16px] font-semibold text-[#111111]">
                        Notifications
                      </h2>
                    </div>
                    <span className="rounded-md bg-[#FFF8EA] px-2.5 py-1 text-[12px] font-semibold text-[#946415]">
                      {dashboard.notifications.unread} unread
                    </span>
                  </div>

                  {dashboard.notifications.alerts.length === 0 ? (
                    <div className="flex items-center gap-3 px-4 py-5 text-[13px] text-[#66737F]">
                      <Inbox className="size-4 text-[#5579B8]" />
                      No notifications.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EEF2F5]">
                      {dashboard.notifications.alerts.map((item) => (
                        <NotificationRow key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-[#E2E8EE] bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#111111]">
                        Overdue Schedules
                      </h2>
                      <p className="mt-1 text-[12px] text-[#66737F]">
                        Active schedules past end time
                      </p>
                    </div>
                    <CalendarDays className="size-5 text-[#A23D3D]" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {dashboard.overdue.schedules.length === 0 ? (
                      <p className="text-[13px] text-[#66737F]">No overdue schedules.</p>
                    ) : (
                      dashboard.overdue.schedules.map((schedule) => (
                        <Link
                          key={schedule.id}
                          href="/facility-manager/schedule"
                          className="block rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3 transition hover:border-[#07584F]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-[13px] font-semibold text-[#111111]">
                                {schedule.title}
                              </p>
                              <p className="mt-1 text-[12px] text-[#66737F]">
                                Technician {formatId(schedule.technicianUserId)}
                              </p>
                            </div>
                            <StatusBadge status={schedule.status} />
                          </div>
                          <p className="mt-2 text-[12px] text-[#A23D3D]">
                            Ended {formatDate(schedule.endAt)}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
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
                count={dashboard.pendingActions.submittedCostsRequiringApproval.count}
                items={dashboard.pendingActions.submittedCostsRequiringApproval.items}
              />
              <PendingActionList
                title="Resident Confirmations"
                fallbackType="complaint"
                count={dashboard.pendingActions.complaintsWaitingResidentConfirmation.count}
                items={dashboard.pendingActions.complaintsWaitingResidentConfirmation.items}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
