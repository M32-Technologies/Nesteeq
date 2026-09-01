"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  ListFilter,
  MessageSquareWarning,
  UserRoundCog,
  Wrench,
} from "lucide-react"

import { getApiErrorMessage, useReportsOverview } from "../facility.api"
import {
  complaintCategories,
  complaintStatuses,
  maintenanceStatuses,
  technicianStatuses,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type Maintenance,
  type MaintenanceStatus,
  type PendingWorkReportData,
  type ReportsQuery,
  type TechnicianReportItem,
  type TechnicianStatus,
} from "../facility.types"
import {
  EmptyState,
  ErrorState,
  FilterSelect,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  LoadingRows,
  MetricCard,
  PageHeader,
  PriorityBadge,
  SearchBox,
  StatusBadge,
  Toolbar,
} from "./facility-ui"

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-[150px]">
      <span className="sr-only">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
      />
    </label>
  )
}

function ReportCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-[#E2E8EE] bg-white">
      <div className="border-b border-[#E2E8EE] px-4 py-4">
        <h2 className="text-[15px] font-semibold text-[#111111]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function BarList({
  values,
  emptyLabel,
}: {
  values: Record<string, number>
  emptyLabel: string
}) {
  const entries = Object.entries(values).filter(([, value]) => value > 0)
  const maxValue = Math.max(...entries.map(([, value]) => value), 1)

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
            <span className="font-semibold text-[#26313D]">{formatLabel(label)}</span>
            <span className="text-[#66737F]">{value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F5]">
            <div
              className="h-full rounded-full bg-[#07584F]"
              style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkTable({
  title,
  rows,
  type,
}: {
  title: string
  rows: Array<Complaint | Maintenance>
  type: "complaint" | "maintenance"
}) {
  if (rows.length === 0) {
    return (
      <ReportCard title={title}>
        <EmptyState
          title={`No ${title.toLowerCase()}`}
          message="Report rows matching the current filters will appear here."
        />
      </ReportCard>
    )
  }

  return (
    <ReportCard title={title}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[960px] text-left">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Technician</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Cost</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {rows.map((row) => (
              <tr key={`${type}-${row._id}`} className="text-[13px] text-[#26313D]">
                <td className="px-3 py-3 font-semibold text-[#111111]">
                  {formatId(row._id)}
                </td>
                <td className="max-w-[260px] px-3 py-3">
                  <div className="truncate font-medium text-[#111111]">{row.title}</div>
                  <div className="mt-1 line-clamp-1 text-[12px] text-[#66737F]">
                    {row.description}
                  </div>
                </td>
                <td className="px-3 py-3">{formatLabel(row.category)}</td>
                <td className="px-3 py-3">{formatId(row.assignedStaff)}</td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={row.priority} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-3 py-3 text-[12px] text-[#66737F]">
                  <div>Est: {formatCurrency(row.estimatedCost)}</div>
                  <div className="mt-1">Final: {formatCurrency(row.finalCost)}</div>
                </td>
                <td className="px-3 py-3 text-[12px] text-[#66737F]">
                  {formatDate(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#EEF2F5] lg:hidden">
        {rows.map((row) => (
          <article key={`${type}-mobile-${row._id}`} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  {formatId(row._id)}
                </p>
                <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold text-[#111111]">
                  {row.title}
                </h3>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <PriorityBadge priority={row.priority} />
              <span className="inline-flex min-h-7 items-center rounded-md border border-[#D6DCE3] bg-[#F3F5F7] px-2.5 text-[11px] font-semibold text-[#687481]">
                {formatLabel(row.category)}
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-[12px] text-[#66737F]">
              <span>Technician {formatId(row.assignedStaff)}</span>
              <span>{formatDate(row.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </ReportCard>
  )
}

function TechnicianTable({ rows }: { rows: TechnicianReportItem[] }) {
  if (rows.length === 0) {
    return (
      <ReportCard title="Technician Workload">
        <EmptyState
          title="No technician workload"
          message="Technician performance data will appear after tasks are assigned."
        />
      </ReportCard>
    )
  }

  return (
    <ReportCard title="Technician Workload">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            <tr>
              <th className="px-3 py-3">Technician</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Assigned</th>
              <th className="px-3 py-3">In progress</th>
              <th className="px-3 py-3">Completed</th>
              <th className="px-3 py-3">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {rows.map((technician) => (
              <tr key={technician._id} className="text-[13px] text-[#26313D]">
                <td className="px-3 py-3">
                  <div className="font-semibold text-[#111111]">
                    {technician.fullName}
                  </div>
                  <div className="mt-1 text-[12px] text-[#8793A0]">
                    {formatId(technician.userId)}
                  </div>
                </td>
                <td className="px-3 py-3">{formatLabel(technician.status)}</td>
                <td className="px-3 py-3">{technician.workload.assignedTasks}</td>
                <td className="px-3 py-3">{technician.workload.inProgressTasks}</td>
                <td className="px-3 py-3">{technician.workload.completedTasks}</td>
                <td className="px-3 py-3">{technician.workload.pendingTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  )
}

function CostSourceRows({
  rows,
}: {
  rows: Array<{
    label: string
    estimatedCost: number
    finalCost: number
    approvedCost: number
    pendingCost: number
  }>
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
          <div className="text-[13px] font-semibold text-[#111111]">{row.label}</div>
          <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
            <span>Estimated: {formatCurrency(row.estimatedCost)}</span>
            <span>Final: {formatCurrency(row.finalCost)}</span>
            <span>Approved: {formatCurrency(row.approvedCost)}</span>
            <span>Pending: {formatCurrency(row.pendingCost)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PendingWorkReport({ data }: { data: PendingWorkReportData }) {
  const counters = [
    ["Open work", data.summary.total],
    ["Complaints", data.summary.complaints],
    ["Maintenance", data.summary.maintenance],
    ["Unassigned", data.summary.unassigned],
    ["Assigned", data.summary.assigned],
    ["Awaiting review", data.summary.awaitingReview],
  ]

  return (
    <ReportCard title="Pending Work Report">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {counters.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
              {label}
            </div>
            <div className="mt-2 text-[22px] font-semibold text-[#111111]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[13px] font-semibold text-[#111111]">
            Complaint statuses
          </h3>
          <BarList
            values={data.summary.byStatus.complaints}
            emptyLabel="No pending complaint work."
          />
        </div>
        <div>
          <h3 className="mb-3 text-[13px] font-semibold text-[#111111]">
            Maintenance statuses
          </h3>
          <BarList
            values={data.summary.byStatus.maintenance}
            emptyLabel="No pending maintenance work."
          />
        </div>
      </div>
    </ReportCard>
  )
}

export default function FacilityReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [technician, setTechnician] = useState("")
  const [category, setCategory] = useState<"all" | ComplaintCategory>("all")
  const [complaintStatus, setComplaintStatus] = useState<"all" | ComplaintStatus>("all")
  const [maintenanceStatus, setMaintenanceStatus] = useState<"all" | MaintenanceStatus>("all")
  const [technicianStatus, setTechnicianStatus] = useState<"all" | TechnicianStatus>("all")

  const reportQuery = useMemo<ReportsQuery>(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      technician: technician || undefined,
      category: category === "all" ? undefined : category,
      complaintStatus: complaintStatus === "all" ? undefined : complaintStatus,
      maintenanceStatus: maintenanceStatus === "all" ? undefined : maintenanceStatus,
      technicianStatus: technicianStatus === "all" ? undefined : technicianStatus,
      page: 1,
      limit: 12,
    }),
    [
      category,
      complaintStatus,
      endDate,
      maintenanceStatus,
      startDate,
      technician,
      technicianStatus,
    ]
  )

  const reportsQuery = useReportsOverview(reportQuery)
  const reports = reportsQuery.data
  const isEmpty =
    reports &&
    reports.complaints.summary.total === 0 &&
    reports.maintenance.summary.total === 0 &&
    reports.technicians.summary.total === 0

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader title="Reports" eyebrow="Dashboard Analytics" />

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <DateInput label="Start date" value={startDate} onChange={setStartDate} />
            <DateInput label="End date" value={endDate} onChange={setEndDate} />
            <SearchBox
              value={technician}
              onChange={setTechnician}
              placeholder="Technician ID"
            />
            <FilterSelect
              label="category"
              value={category}
              options={complaintCategories}
              onChange={setCategory}
            />
            <FilterSelect
              label="complaint status"
              value={complaintStatus}
              options={complaintStatuses}
              onChange={setComplaintStatus}
            />
            <FilterSelect
              label="maintenance status"
              value={maintenanceStatus}
              options={maintenanceStatuses}
              onChange={setMaintenanceStatus}
            />
            <FilterSelect
              label="technician status"
              value={technicianStatus}
              options={technicianStatuses}
              onChange={setTechnicianStatus}
            />
          </Toolbar>
        </div>

        {reportsQuery.isPending ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
            <LoadingRows rows={8} />
          </div>
        ) : reportsQuery.isError ? (
          <div className="mt-6 rounded-lg border border-[#E2E8EE] bg-white">
            <ErrorState
              title="Unable to load reports"
              message={getApiErrorMessage(
                reportsQuery.error,
                "The reports dashboard could not be loaded."
              )}
              isRetrying={reportsQuery.isFetching}
              onRetry={() => void reportsQuery.refetch()}
            />
          </div>
        ) : reports && isEmpty ? (
          <div className="mt-6 rounded-lg border border-[#E2E8EE] bg-white">
            <EmptyState
              title="No report data found"
              message="Try adjusting the filters or date range."
            />
          </div>
        ) : reports ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                title="Total complaints"
                value={reports.complaints.summary.total}
                icon={MessageSquareWarning}
                tone="blue"
              />
              <MetricCard
                title="Maintenance tasks"
                value={reports.maintenance.summary.total}
                icon={Wrench}
                tone="green"
              />
              <MetricCard
                title="Pending work"
                value={reports.pendingWork.summary.total}
                icon={ClipboardList}
                tone="amber"
              />
              <MetricCard
                title="Technicians"
                value={reports.technicians.summary.total}
                icon={UserRoundCog}
                tone="gray"
              />
              <MetricCard
                title="Approved cost"
                value={reports.costs.summary.approvedCost}
                icon={CircleDollarSign}
                tone="green"
              />
              <MetricCard
                title="Pending cost"
                value={reports.costs.summary.pendingCost}
                icon={Clock3}
                tone="amber"
              />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              <ReportCard title="Complaint Statistics">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Pending", reports.complaints.summary.pending],
                      ["In progress", reports.complaints.summary.inProgress],
                      ["Resolved", reports.complaints.summary.completed],
                      ["Cancelled", reports.complaints.summary.cancelled],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                          {label}
                        </div>
                        <div className="mt-2 text-[24px] font-semibold text-[#111111]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <BarList
                    values={reports.complaints.summary.byCategory}
                    emptyLabel="No complaint category data."
                  />
                </div>
              </ReportCard>

              <ReportCard title="Maintenance Statistics">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Pending", reports.maintenance.summary.pending],
                      ["In progress", reports.maintenance.summary.inProgress],
                      ["Completed", reports.maintenance.summary.completed],
                      ["Cancelled", reports.maintenance.summary.cancelled],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                          {label}
                        </div>
                        <div className="mt-2 text-[24px] font-semibold text-[#111111]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <BarList
                    values={reports.maintenance.summary.byCategory}
                    emptyLabel="No maintenance category data."
                  />
                </div>
              </ReportCard>

              <ReportCard title="Technician Statistics">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Active", reports.technicians.summary.active],
                      ["Inactive", reports.technicians.summary.inactive],
                      ["Assigned", reports.technicians.summary.assignedTasks],
                      ["Completed", reports.technicians.summary.completedTasks],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-3"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                          {label}
                        </div>
                        <div className="mt-2 text-[24px] font-semibold text-[#111111]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <BarList
                    values={reports.technicians.summary.byStatus}
                    emptyLabel="No technician status data."
                  />
                </div>
              </ReportCard>
            </div>

            <div className="mt-6">
              <ReportCard title="Expense And Cost Summary">
                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Estimated cost",
                        value: reports.costs.summary.totalEstimatedCost,
                        icon: ListFilter,
                      },
                      {
                        label: "Final cost",
                        value: reports.costs.summary.totalFinalCost,
                        icon: CheckCircle2,
                      },
                      {
                        label: "Approved cost",
                        value: reports.costs.summary.approvedCost,
                        icon: CircleDollarSign,
                      },
                      {
                        label: "Pending cost",
                        value: reports.costs.summary.pendingCost,
                        icon: Clock3,
                      },
                    ].map((item) => {
                      const Icon = item.icon

                      return (
                        <div
                          key={item.label}
                          className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[12px] font-semibold text-[#66737F]">
                              {item.label}
                            </div>
                            <Icon className="size-4 text-[#07584F]" />
                          </div>
                          <div className="mt-3 text-[22px] font-semibold text-[#111111]">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <CostSourceRows
                    rows={[
                      {
                        label: "Complaints",
                        ...reports.costs.summary.bySource.complaints,
                      },
                      {
                        label: "Maintenance",
                        ...reports.costs.summary.bySource.maintenance,
                      },
                    ]}
                  />
                </div>
              </ReportCard>
            </div>

            <div className="mt-6">
              <PendingWorkReport data={reports.pendingWork} />
            </div>

            <div className="mt-6 grid gap-4">
              <WorkTable
                title="Pending Complaint Work"
                type="complaint"
                rows={reports.pendingWork.complaints}
              />
              <WorkTable
                title="Pending Maintenance Work"
                type="maintenance"
                rows={reports.pendingWork.maintenance}
              />
              <WorkTable
                title="Complaint Report Details"
                type="complaint"
                rows={reports.complaints.complaints}
              />
              <WorkTable
                title="Maintenance Report Details"
                type="maintenance"
                rows={reports.maintenance.maintenance}
              />
              <TechnicianTable rows={reports.technicians.technicians} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
