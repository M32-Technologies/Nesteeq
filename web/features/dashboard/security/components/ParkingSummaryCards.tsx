"use client"

import type { VisitorParkingSummary } from "../services/parking.service"

export function ParkingSummaryCards({
  summary,
}: {
  summary?: VisitorParkingSummary
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Total Visitor Slots"
        value={summary?.totalVisitorSlots ?? 0}
      />
      <SummaryCard
        label="Available"
        value={summary?.available ?? 0}
      />
      <SummaryCard
        label="Occupied"
        value={summary?.occupied ?? 0}
      />
      <SummaryCard
        label="Reserved"
        value={summary?.reserved ?? 0}
      />
      <SummaryCard
        label="Unavailable"
        value={summary?.outOfService ?? 0}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-[#DDE3DF] bg-white p-4">
      <p className="text-xs font-semibold uppercase text-[#637083]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#111111]">
        {value}
      </p>
    </div>
  )
}
