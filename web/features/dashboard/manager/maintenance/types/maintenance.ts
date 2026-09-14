export type WorkProgressStage =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "INSPECTION"
  | "COMPLETED"

export type WorkPriority = "NORMAL" | "HIGH" | "URGENT"

export type MaintenanceTrade =
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "ELEVATOR"
  | "CARPENTRY"
  | "PAINTING"
  | "CIVIL"
  | "GENERAL"

export interface MaintenanceWorkOrder {
  id: string
  jobId: string
  title: string
  description: string
  location: string // e.g. "Flat A-302" or "Tower B Elevator" or "Common Generator"
  category: MaintenanceTrade
  priority: WorkPriority
  stage: WorkProgressStage
  progressPercentage: number // 0 to 100
  assignedWorkerId?: string
  assignedWorkerName?: string
  assignedWorkerTrade?: string
  assignedWorkerPhone?: string
  assignedBy?: string
  startedAt?: string
  estimatedCompletion?: string
  completedAt?: string
  notes?: string
}

export interface MaintenanceStats {
  activeJobs: number
  workersOnDuty: number
  pendingAssignment: number
  completedToday: number
}

export interface WorkOrderFilterParams {
  search?: string
  stage?: "ALL" | WorkProgressStage
  priority?: "ALL" | WorkPriority
  category?: "ALL" | MaintenanceTrade
  page: number
  limit: number
}
