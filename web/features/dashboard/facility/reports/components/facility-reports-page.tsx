"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  UserRoundCog,
  Wrench,
} from "lucide-react"

import { useReportsOverviewQuery } from "@/features/dashboard/facility/reports/hooks/use-reports-queries"
import type { ReportsQuery } from "@/features/dashboard/facility/reports/types/reports.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  EmptyState,
  ErrorState,
  formatCurrency,
  LoadingRows,
  MetricCard,
  PageHeader,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function FacilityReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const queryParams: ReportsQuery = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [endDate, startDate]
  )

  const reportsQuery = useReportsOverviewQuery(queryParams)
  const reportData = reportsQuery.data

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader title="Facility Reports" eyebrow="Analytics & Overview" />

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-[#E2E8EE] bg-white p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#26313D]">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-[#DDE5EC] px-3 text-xs outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#26313D]">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-lg border border-[#DDE5EC] px-3 text-xs outline-none"
            />
          </label>
        </div>

        {reportsQuery.isPending ? (
          <div className="mt-6">
            <LoadingRows rows={6} />
          </div>
        ) : reportsQuery.isError ? (
          <div className="mt-6 rounded-lg border border-[#E2E8EE] bg-white">
            <ErrorState
              title="Unable to load reports"
              message={getApiErrorMessage(reportsQuery.error, "Reports overview data could not be loaded.")}
              onRetry={() => void reportsQuery.refetch()}
            />
          </div>
        ) : reportData ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Complaints"
                value={reportData.complaintsSummary?.total ?? 0}
                icon={ClipboardList}
                tone="blue"
              />
              <MetricCard
                title="Resolved Complaints"
                value={reportData.complaintsSummary?.resolved ?? 0}
                icon={CheckCircle2}
                tone="green"
              />
              <MetricCard
                title="Total Maintenance"
                value={reportData.maintenanceSummary?.total ?? 0}
                icon={Wrench}
                tone="amber"
              />
              <MetricCard
                title="Maintenance Cost"
                value={reportData.maintenanceSummary?.totalCost ?? 0}
                icon={CircleDollarSign}
                tone="gray"
              />
            </div>

            <div className="rounded-lg border border-[#E2E8EE] bg-white p-6">
              <h2 className="text-base font-semibold text-[#111111]">Technician Performance</h2>
              {reportData.technicianPerformance?.length === 0 ? (
                <EmptyState title="No technician activity" message="Technician work analytics will appear here." />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E2E8EE] bg-[#FBFCFD] font-semibold text-[#8793A0]">
                      <tr>
                        <th className="px-4 py-2">Technician</th>
                        <th className="px-4 py-2">Completed Jobs</th>
                        <th className="px-4 py-2">Active Jobs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F5]">
                      {reportData.technicianPerformance?.map((tech) => (
                        <tr key={tech.technicianId}>
                          <td className="px-4 py-3 font-semibold text-[#111111]">{tech.name}</td>
                          <td className="px-4 py-3 text-[#26733E] font-medium">{tech.completedJobs}</td>
                          <td className="px-4 py-3 text-[#946415] font-medium">{tech.activeJobs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FacilityReportsPage
