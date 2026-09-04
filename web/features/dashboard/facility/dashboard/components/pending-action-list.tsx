import Link from "next/link"

import type { Complaint } from "@/features/dashboard/facility/complaints/types/complaints.types"
import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import {
  formatCurrency,
  formatId,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function PendingActionList({
  pendingActions = {
    complaintsToAssign: [],
    complaintsToApprove: [],
    maintenanceToApprove: [],
    maintenanceCostToReview: [],
  },
}: {
  pendingActions?: {
    complaintsToAssign: Complaint[]
    complaintsToApprove: Complaint[]
    maintenanceToApprove: Maintenance[]
    maintenanceCostToReview: Maintenance[]
  }
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#E2E8EE] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] px-4 py-4">
          <h2 className="text-[15px] font-semibold text-[#111111]">Complaints Needing Assignment</h2>
          <span className="rounded-md bg-[#EEF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#2E639B]">
            {pendingActions.complaintsToAssign.length}
          </span>
        </div>

        {pendingActions.complaintsToAssign.length === 0 ? (
          <div className="px-4 py-5 text-[13px] text-[#66737F]">No pending items.</div>
        ) : (
          <div className="divide-y divide-[#EEF2F5]">
            {pendingActions.complaintsToAssign.map((item) => (
              <Link
                key={item._id}
                href="/facility-manager/complaints"
                className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#07584F]">{formatId(item._id)}</p>
                    <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">{item.title}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={item.status} />
                    <PriorityBadge priority={item.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#E2E8EE] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] px-4 py-4">
          <h2 className="text-[15px] font-semibold text-[#111111]">Maintenance Needing Review</h2>
          <span className="rounded-md bg-[#EEF6FF] px-2.5 py-1 text-[12px] font-semibold text-[#2E639B]">
            {pendingActions.maintenanceToApprove.length + pendingActions.maintenanceCostToReview.length}
          </span>
        </div>

        {pendingActions.maintenanceToApprove.length === 0 && pendingActions.maintenanceCostToReview.length === 0 ? (
          <div className="px-4 py-5 text-[13px] text-[#66737F]">No pending items.</div>
        ) : (
          <div className="divide-y divide-[#EEF2F5]">
            {[...pendingActions.maintenanceToApprove, ...pendingActions.maintenanceCostToReview].map((item) => (
              <Link
                key={item._id}
                href="/facility-manager/maintenance"
                className="block px-4 py-4 transition hover:bg-[#FBFCFD]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#07584F]">{formatId(item._id)}</p>
                    <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#111111]">{item.title}</p>
                    {item.estimatedCost !== undefined ? (
                      <p className="mt-1 text-[12px] text-[#66737F]">{formatCurrency(item.estimatedCost)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={item.status} />
                    <PriorityBadge priority={item.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
