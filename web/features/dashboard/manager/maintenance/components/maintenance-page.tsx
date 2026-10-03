"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import MaintenanceHeader from "./maintenance-header"
import MaintenanceWorkTable from "./maintenance-work-table"
import WorkProgressDrawer from "./work-progress-drawer"
import { fetchMaintenance } from "@/features/dashboard/facility/maintenance/api/maintenance.api"
import type {
  MaintenanceStats,
  MaintenanceTrade,
  MaintenanceWorkOrder,
  WorkPriority,
  WorkProgressStage,
} from "../types/maintenance"

function mapTradeCategory(cat?: string): MaintenanceTrade {
  const upper = (cat || "").toUpperCase()
  if (upper.includes("PLUMB")) return "PLUMBING"
  if (upper.includes("ELECT")) return "ELECTRICAL"
  if (upper.includes("HVAC") || upper.includes("AC") || upper.includes("AIR")) return "HVAC"
  if (upper.includes("LIFT") || upper.includes("ELEVAT")) return "ELEVATOR"
  if (upper.includes("CARPENT")) return "CARPENTRY"
  if (upper.includes("PAINT")) return "PAINTING"
  if (upper.includes("CIVIL")) return "CIVIL"
  return "GENERAL"
}

function mapPriority(pri?: string): WorkPriority {
  const upper = (pri || "").toUpperCase()
  if (upper === "URGENT") return "URGENT"
  if (upper === "HIGH") return "HIGH"
  return "NORMAL"
}

function mapStage(status?: string): WorkProgressStage {
  const upper = (status || "").toUpperCase()
  if (upper === "COMPLETED" || upper === "APPROVED" || upper === "CLOSED") return "COMPLETED"
  if (upper === "WORK_COMPLETED" || upper === "AWAITING_APPROVAL" || upper === "INSPECTION") return "INSPECTION"
  if (upper === "ON_HOLD" || upper === "CANCELLED" || upper === "REJECTED") return "ON_HOLD"
  if (upper === "IN_PROGRESS") return "IN_PROGRESS"
  return "ASSIGNED"
}

function getProgressPercentage(item: any, stage: WorkProgressStage): number {
  if (stage === "COMPLETED") return 100
  if (stage === "INSPECTION") return 90
  if (stage === "ON_HOLD") return 40
  if (stage === "IN_PROGRESS") {
    const updates = item.progressUpdates
    if (Array.isArray(updates) && updates.length > 0) {
      const last = updates[updates.length - 1]
      if (typeof last?.percentage === "number") return last.percentage
    }
    return 60
  }
  return 25
}

export default function MaintenancePage() {
  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<MaintenanceWorkOrder | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ["manager-maintenance", debouncedSearch],
    queryFn: () =>
      fetchMaintenance({
        limit: 100,
        search: debouncedSearch.trim() || undefined,
      }),
    staleTime: 30 * 1000,
  })

  const rawList = data?.maintenance ?? []

  const workOrders: MaintenanceWorkOrder[] = useMemo(() => {
    return rawList.map((item: any) => {
      const stage = mapStage(item.status)
      const assigned = item.assignedTo || item.assignedStaff
      let workerName: string | undefined = item.assignedWorkerName
      let workerId: string | undefined = undefined
      let workerTrade: string | undefined = item.assignedWorkerTrade
      let workerPhone: string | undefined = item.assignedWorkerPhone

      if (typeof assigned === "object" && assigned !== null) {
        workerName = workerName || assigned.name || assigned.fullName
        workerId = assigned._id || assigned.id || assigned.userId
        workerTrade = workerTrade || assigned.trade || assigned.specialization || assigned.role
        workerPhone = workerPhone || assigned.phone
      } else if (typeof assigned === "string" && assigned) {
        workerId = assigned
        workerName = workerName || "Assigned Worker"
      }

      const location = item.flat
        ? `Flat ${item.flat}`
        : item.location || "Apartment Complex"

      return {
        id: item._id,
        jobId: `JOB-${item._id.slice(-6).toUpperCase()}`,
        title: item.title,
        description: item.description || "",
        location,
        category: mapTradeCategory(item.category),
        priority: mapPriority(item.priority),
        stage,
        progressPercentage: getProgressPercentage(item, stage),
        assignedWorkerId: workerId,
        assignedWorkerName: workerName,
        assignedWorkerTrade: workerTrade,
        assignedWorkerPhone: workerPhone,
        assignedBy: item.assignedBy || undefined,
        startedAt: item.startedAt || undefined,
        estimatedCompletion: item.scheduledDate || item.estimatedCompletionDate || undefined,
        completedAt: item.completedAt || undefined,
        notes: item.workNotes || undefined,
      }
    })
  }, [rawList])

  const stats: MaintenanceStats = useMemo(() => {
    const activeJobs = workOrders.filter((w) => w.stage !== "COMPLETED").length
    const activeWorkers = new Set(
      workOrders
        .filter((w) => w.stage === "IN_PROGRESS" || w.stage === "ASSIGNED")
        .map((w) => w.assignedWorkerId || w.assignedWorkerName)
        .filter(Boolean)
    ).size
    const inProgress = workOrders.filter((w) => w.stage === "IN_PROGRESS").length
    const completed = workOrders.filter((w) => w.stage === "COMPLETED").length

    return {
      activeJobs,
      workersOnDuty: activeWorkers,
      pendingAssignment: inProgress,
      completedToday: completed,
    }
  }, [workOrders])

  return (
    <div className="space-y-6">
      <MaintenanceHeader stats={stats} isLoading={isLoading} />

      <MaintenanceWorkTable
        workOrders={workOrders}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
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

