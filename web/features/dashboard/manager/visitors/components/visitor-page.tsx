"use client"

import { useState } from "react"

import VisitorHeader from "./visitor-header"
import VisitorTableSection from "./visitor-table-section"
import VisitorDetailsDrawer from "./visitor-details-drawer"
import type { VisitorRecord, VisitorStats } from "../types/visitors"

export default function VisitorPage() {
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null)

  // Empty data state by default while backend is under construction (no dummy data)
  const records: VisitorRecord[] = []
  const stats: VisitorStats = {
    totalToday: 0,
    currentlyInside: 0,
    checkedOutToday: 0,
  }

  return (
    <div className="space-y-6 p-6">
      <VisitorHeader stats={stats} />

      <VisitorTableSection
        records={records}
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
