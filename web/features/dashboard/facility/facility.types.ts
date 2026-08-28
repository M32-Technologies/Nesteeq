export const complaintStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const

export const maintenanceStatuses = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const

export const complaintCategories = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "SECURITY",
  "LIFT",
  "WATER",
  "MAINTENANCE",
  "OTHER",
] as const

export const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export const technicianStatuses = [
  "ACTIVE",
  "BUSY",
  "ON_LEAVE",
  "INACTIVE",
] as const

export const maintenanceCostStatuses = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const

export const scheduleStatuses = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
] as const

export const scheduleWorkTypes = ["complaint", "maintenance"] as const

export type ComplaintStatus = (typeof complaintStatuses)[number]
export type MaintenanceStatus = (typeof maintenanceStatuses)[number]
export type ComplaintCategory = (typeof complaintCategories)[number]
export type Priority = (typeof priorities)[number]
export type TechnicianStatus = (typeof technicianStatuses)[number]
export type MaintenanceCostStatus = (typeof maintenanceCostStatuses)[number]
export type ScheduleStatus = (typeof scheduleStatuses)[number]
export type ScheduleWorkType = (typeof scheduleWorkTypes)[number]

export type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type ActivityNote = {
  message: string
  by: string
  role: string
  createdAt: string
}

export type CompletionDetails = {
  details?: string | null
  workNotes?: string | null
  completedBy?: string | null
  completedAt?: string | null
}

export type ApprovalDetails = {
  status?: "APPROVED" | "REJECTED" | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  remarks?: string | null
  rejectionReason?: string | null
}

export type ResidentConfirmation = {
  status?: "PENDING" | "CONFIRMED" | null
  requestedAt?: string | null
  confirmedBy?: string | null
  confirmedAt?: string | null
  remarks?: string | null
}

export type MaintenanceCostReview = {
  status: MaintenanceCostStatus
  submittedAmount?: number | null
  submittedBy?: string | null
  submittedAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  remarks?: string | null
  rejectionReason?: string | null
  forwardedToRole?: string | null
  forwardedAt?: string | null
}

export type Complaint = {
  _id: string
  resident: string
  apartment: string
  flat: string
  title: string
  description: string
  category: ComplaintCategory
  priority: Priority
  status: ComplaintStatus
  assignedStaff?: string | null
  assignedBy?: string | null
  assignedAt?: string | null
  remarks?: ActivityNote[]
  estimatedCost?: number | null
  finalCost?: number | null
  completionDetails?: CompletionDetails | null
  approvalDetails?: ApprovalDetails | null
  residentConfirmation?: ResidentConfirmation | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  cancellationReason?: string | null
  closedBy?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type MaintenanceProgressUpdate = {
  details: string
  status: MaintenanceStatus
  remarks?: string | null
  by: string
  role: string
  createdAt: string
}

export type Maintenance = {
  _id: string
  complaint: string
  resident: string
  apartment: string
  flat: string
  assignedStaff?: string | null
  category: ComplaintCategory
  title: string
  description: string
  priority: Priority
  status: MaintenanceStatus
  assignedBy?: string | null
  assignedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  estimatedCost?: number | null
  finalCost?: number | null
  progressUpdates?: MaintenanceProgressUpdate[]
  workNotes?: ActivityNote[]
  completionDetails?: CompletionDetails | null
  managerRemarks?: ActivityNote[]
  approvalDetails?: ApprovalDetails | null
  costReview?: MaintenanceCostReview | null
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  closedBy?: string | null
  closedAt?: string | null
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

export type Technician = {
  _id: string
  userId: string
  fullName: string
  email?: string | null
  phone?: string | null
  apartmentId?: string | null
  employeeCode?: string | null
  specializations: ComplaintCategory[]
  status: TechnicianStatus
  shift?: string | null
  notes?: string | null
  joinedAt?: string | null
  deactivatedAt?: string | null
  deactivatedBy?: string | null
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

export type ScheduleHistoryItem = {
  status: ScheduleStatus
  note?: string | null
  by: string
  role: string
  createdAt: string
}

export type Schedule = {
  _id: string
  title: string
  description?: string | null
  technician: string
  technicianUserId: string
  workType: ScheduleWorkType
  complaint?: string | null
  maintenance?: string | null
  apartment?: string | null
  flat?: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  startAt: string
  endAt: string
  priority: Priority
  status: ScheduleStatus
  notes?: string | null
  completionDetails?: string | null
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  statusHistory?: ScheduleHistoryItem[]
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

export type ComplaintsListData = {
  complaints: Complaint[]
  pagination: Pagination
}

export type MaintenanceListData = {
  maintenance: Maintenance[]
  pagination: Pagination
}

export type TechniciansListData = {
  technicians: Technician[]
  pagination: Pagination
}

export type ScheduleSummary = {
  total: number
  today: number
  upcoming: number
  inProgress: number
  completed: number
  cancelled: number
  scheduled: number
  rescheduled: number
}

export type ScheduleListData = {
  schedules: Schedule[]
  summary: ScheduleSummary
  pagination: Pagination
}

export type ComplaintQuery = {
  status?: ComplaintStatus
  category?: ComplaintCategory
  priority?: Priority
  apartment?: string
  flat?: string
  resident?: string
  assignedStaff?: string
  page?: number
  limit?: number
}

export type MaintenanceQuery = {
  status?: MaintenanceStatus
  category?: ComplaintCategory
  priority?: Priority
  complaint?: string
  apartment?: string
  flat?: string
  resident?: string
  assignedStaff?: string
  costStatus?: MaintenanceCostStatus
  page?: number
  limit?: number
}

export type TechnicianQuery = {
  status?: TechnicianStatus
  specialization?: ComplaintCategory
  apartmentId?: string
  search?: string
  page?: number
  limit?: number
}

export type ScheduleQuery = {
  date?: string
  startDate?: string
  endDate?: string
  technician?: string
  status?: ScheduleStatus
  priority?: Priority
  workType?: ScheduleWorkType
  search?: string
  page?: number
  limit?: number
}

export type AssignPayload = {
  assignedStaff: string
  estimatedCost?: number
  remarks?: string
}

export type ComplaintUpdatePayload = {
  title?: string
  description?: string
  category?: ComplaintCategory
  priority?: Priority
  estimatedCost?: number
  remarks?: string
}

export type MaintenanceUpdatePayload = {
  title?: string
  description?: string
  category?: ComplaintCategory
  priority?: Priority
  estimatedCost?: number
  managerRemarks?: string
}

export type StatusPayload<TStatus extends string> = {
  status: TStatus
  remarks?: string
}

export type ReasonPayload = {
  reason?: string
  remarks?: string
}

export type RequiredReasonPayload = {
  reason: string
  remarks?: string
}

export type CreateMaintenancePayload = {
  complaint: string
  assignedStaff?: string
  category?: ComplaintCategory
  title?: string
  description?: string
  priority?: Priority
  estimatedCost?: number
  remarks?: string
}

export type CreateTechnicianPayload = {
  userId: string
  fullName: string
  email?: string
  phone?: string
  apartmentId?: string
  employeeCode?: string
  specializations?: ComplaintCategory[]
  status?: TechnicianStatus
  shift?: string
  notes?: string
}

export type CreateSchedulePayload = {
  title: string
  description?: string
  technician: string
  workType: ScheduleWorkType
  complaint?: string
  maintenance?: string
  scheduledDate: string
  startTime: string
  endTime: string
  priority?: Priority
  notes?: string
}

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>

export type ReschedulePayload = {
  technician?: string
  scheduledDate: string
  startTime: string
  endTime: string
  notes?: string
}

export type UpdateScheduleStatusPayload = {
  status: ScheduleStatus
  notes?: string
  completionDetails?: string
  finalCost?: number
}

export type UpdateTechnicianPayload = {
  fullName?: string
  email?: string
  phone?: string
  apartmentId?: string
  employeeCode?: string
  specializations?: ComplaintCategory[]
  shift?: string
  notes?: string
}

export type UpdateTechnicianStatusPayload = {
  status: TechnicianStatus
  notes?: string
}

export type AssignTechnicianWorkPayload = {
  workType: "complaint" | "maintenance"
  workId: string
  estimatedCost?: number
  remarks?: string
}

export type TechnicianTasksQuery = {
  type?: "all" | "complaint" | "maintenance"
  complaintStatus?: ComplaintStatus
  maintenanceStatus?: MaintenanceStatus
  page?: number
  limit?: number
}

export type TechnicianTasksData = {
  technician: Technician
  complaints: Complaint[]
  maintenance: Maintenance[]
  totals: {
    complaints: number
    maintenance: number
    all: number
  }
  pagination: Pick<Pagination, "page" | "limit">
}

export type UpdateTechnicianTaskStatusPayload = {
  workType: "complaint" | "maintenance"
  workId: string
  status: ComplaintStatus | MaintenanceStatus
  remarks?: string
  progressDetails?: string
  completionDetails?: string
  finalCost?: number
  workNotes?: string
}

export type MaintenanceProgressPayload = {
  progressDetails: string
  status?: "IN_PROGRESS" | "ON_HOLD"
  remarks?: string
}

export type FacilityComplaintStats = {
  total: number
  pending: number
  assigned: number
  inProgress: number
  resolved: number
  awaitingApproval: number
}

export type FacilityMaintenanceStats = {
  total: number
  pending: number
  assigned: number
  inProgress: number
  active: number
  completed: number
  pendingApprovals: number
}

export type FacilityTechnicianStats = {
  total: number
  active: number
  busy: number
  onLeave: number
  inactive: number
}

export type FacilityScheduleStats = ScheduleSummary

export type FacilityDashboardStatData = {
  openComplaints: number
  pendingMaintenanceRequests: number
  assignedTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueTasks: number
  pendingApprovals: number
  technicians: number
}

export type FacilityDashboardWorkItem = {
  id: string
  title: string
  status?: string | null
  priority?: string | null
  createdAt: string
  updatedAt: string
  type?: "complaint" | "maintenance"
  submittedAmount?: number | null
}

export type FacilityPendingActionGroup = {
  count: number
  items: FacilityDashboardWorkItem[]
}

export type FacilityActivityItem = {
  id: string
  type:
    | "NEW_COMPLAINT"
    | "TECHNICIAN_UPDATE"
    | "WORK_COMPLETED"
    | "COST_SUBMITTED"
    | "RESIDENT_CONFIRMATION"
  title: string
  description: string
  resourceType: "complaint" | "maintenance"
  resourceId: string
  occurredAt: string
  status?: string | null
  priority?: string | null
}

export type FacilityNotificationItem = {
  id: string
  type: string
  severity: string
  title: string
  message: string
  relatedResourceType?: string | null
  relatedResourceId?: string | null
  readAt?: string | null
  createdAt: string
}

export type FacilityDashboardData = {
  stats: FacilityDashboardStatData
  pendingActions: {
    unassignedComplaints: FacilityPendingActionGroup
    tasksWaitingAssignment: FacilityPendingActionGroup
    workRequiringReview: FacilityPendingActionGroup
    submittedCostsRequiringApproval: FacilityPendingActionGroup
    complaintsWaitingResidentConfirmation: FacilityPendingActionGroup
  }
  overdue: {
    count: number
    schedules: Array<{
      id: string
      title: string
      status: string
      priority: Priority
      technicianUserId: string
      endAt: string
    }>
  }
  recentActivity: FacilityActivityItem[]
  notifications: {
    unread: number
    alerts: FacilityNotificationItem[]
  }
}

export type ReportsQuery = {
  startDate?: string
  endDate?: string
  apartment?: string
  technician?: string
  category?: ComplaintCategory
  complaintStatus?: ComplaintStatus
  maintenanceStatus?: MaintenanceStatus
  technicianStatus?: TechnicianStatus
  page?: number
  limit?: number
}

export type ReportStatusMap = Record<string, number>

export type ComplaintReportData = {
  summary: {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
    byStatus: ReportStatusMap
    byCategory: ReportStatusMap
  }
  complaints: Complaint[]
  pagination: Pagination
}

export type MaintenanceReportData = {
  summary: {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
    byStatus: ReportStatusMap
    byCategory: ReportStatusMap
  }
  maintenance: Maintenance[]
  pagination: Pagination
}

export type TechnicianWorkload = {
  assignedTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
}

export type TechnicianReportItem = Technician & {
  workload: TechnicianWorkload
}

export type TechnicianReportData = {
  summary: {
    total: number
    active: number
    busy: number
    onLeave: number
    inactive: number
    assignedTasks: number
    completedTasks: number
    byStatus: ReportStatusMap
  }
  technicians: TechnicianReportItem[]
}

export type CostReportSource = {
  estimatedCost: number
  finalCost: number
  approvedCost: number
  pendingCost: number
}

export type CostReportData = {
  summary: {
    totalEstimatedCost: number
    totalFinalCost: number
    approvedCost: number
    pendingCost: number
    bySource: {
      complaints: CostReportSource
      maintenance: CostReportSource
    }
  }
}

export type PendingWorkReportData = {
  summary: {
    total: number
    complaints: number
    maintenance: number
    unassigned: number
    assigned: number
    inProgress: number
    awaitingReview: number
    byStatus: {
      complaints: ReportStatusMap
      maintenance: ReportStatusMap
    }
  }
  complaints: Complaint[]
  maintenance: Maintenance[]
  pagination: Pagination
}

export type ReportsOverviewData = {
  filters: {
    startDate?: string | null
    endDate?: string | null
    apartment?: string | null
    technician?: string | null
    category?: ComplaintCategory | null
    complaintStatus?: ComplaintStatus | null
    maintenanceStatus?: MaintenanceStatus | null
    technicianStatus?: TechnicianStatus | null
  }
  complaints: ComplaintReportData
  maintenance: MaintenanceReportData
  technicians: TechnicianReportData
  costs: CostReportData
  pendingWork: PendingWorkReportData
}
