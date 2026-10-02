export type ReportsQuery = {
  startDate?: string
  endDate?: string
  buildingId?: string
}

export type ReportsOverviewData = {
  complaintsSummary: {
    total: number
    resolved: number
    pending: number
    averageResolutionTimeHours?: number
  }
  maintenanceSummary: {
    total: number
    completed: number
    inProgress: number
    totalCost?: number
  }
  technicianPerformance: Array<{
    technicianId: string
    name: string
    completedJobs: number
    activeJobs: number
  }>
}
