"use client"

import { useMemo, useState } from "react"

import VisitorHeader from "./visitor-header"
import VisitorTableSection from "./visitor-table-section"
import VisitorDetailsDrawer from "./visitor-details-drawer"
import type { VisitorRecord, VisitorStats } from "../types/visitors"
import {
  useManagerVisitorsQuery,
  useManagerActiveVisitorsQuery,
} from "../hooks/useManagerVisitors"

export default function VisitorPage() {
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null)

  const { data: recordsData, isLoading } = useManagerVisitorsQuery({
    limit: 100,
    fetchAll: true,
  })
  const { data: activeData } = useManagerActiveVisitorsQuery()

  const records: VisitorRecord[] = useMemo(() => {
    return recordsData?.records ?? []
  }, [recordsData])

  const stats: VisitorStats = useMemo(() => {
    const totalToday = recordsData?.pagination?.total ?? records.length
    const currentlyInside =
      activeData?.pagination?.total ??
      records.filter((r) => r.status === "ACTIVE").length
    const checkedOutToday = records.filter(
      (r) => r.status === "CHECKED_OUT"
    ).length

    return {
      totalToday,
      currentlyInside,
      checkedOutToday,
    }
  }, [recordsData, activeData, records])

  return (
    <div className="space-y-6 p-6">
      <VisitorHeader stats={stats} isLoading={isLoading} />

      <VisitorTableSection
        records={records}
        isLoading={isLoading}
        onViewRecord={(rec) => setSelectedVisitor(rec)}
      />

      <VisitorDetailsDrawer
        visitor={selectedVisitor}
        open={Boolean(selectedVisitor)}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  )
}
