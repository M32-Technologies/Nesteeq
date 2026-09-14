"use client"

import { useState } from "react"

import MaintenanceHeader from "./maintenance-header"
import MaintenanceWorkTable from "./maintenance-work-table"
import WorkProgressDrawer from "./work-progress-drawer"
import type {
  MaintenanceStats,
  MaintenanceWorkOrder,
} from "../types/maintenance"

export default function MaintenancePage() {
  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<MaintenanceWorkOrder | null>(null)

  // Empty data state by default while backend is under construction (strictly no dummy data)
  const workOrders: MaintenanceWorkOrder[] = []
  const stats: MaintenanceStats = {
    activeJobs: 0,
    workersOnDuty: 0,
    pendingAssignment: 0,
    completedToday: 0,
  }

  return (
    <div className="space-y-6 p-6">
      <MaintenanceHeader stats={stats} />

      <MaintenanceWorkTable
        workOrders={workOrders}
        onViewWorkOrder={(order) => setSelectedWorkOrder(order)}
      />

      <WorkProgressDrawer
        workOrder={selectedWorkOrder}
        open={Boolean(selectedWorkOrder)}
        onClose={() => setSelectedWorkOrder(null)}
      />
    </div>
  )
}
