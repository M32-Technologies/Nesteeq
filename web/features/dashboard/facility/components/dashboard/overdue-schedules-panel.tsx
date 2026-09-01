import Link from "next/link"
import { CalendarDays } from "lucide-react"

import type { FacilityDashboardData } from "../../facility.types"
import {
  formatDate,
  formatId,
  StatusBadge,
} from "../facility-ui"

export function OverdueSchedulesPanel({
  overdue,
}: {
  overdue: FacilityDashboardData["overdue"]
}) {
  return (
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
        {overdue.schedules.length === 0 ? (
          <p className="text-[13px] text-[#66737F]">No overdue schedules.</p>
        ) : (
          overdue.schedules.map((schedule) => (
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
  )
}
