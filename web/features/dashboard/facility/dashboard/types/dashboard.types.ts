import type {
  Complaint,
  FacilityComplaintStats,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import type {
  FacilityMaintenanceStats,
  Maintenance,
} from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import type {
  FacilityScheduleStats,
  Schedule,
} from "@/features/dashboard/facility/schedule/types/schedule.types"
import type { FacilityTechnicianStats } from "@/features/dashboard/facility/technicians/types/technicians.types"

export type {
  FacilityComplaintStats,
  FacilityMaintenanceStats,
  FacilityScheduleStats,
  FacilityTechnicianStats,
}

export type FacilityDashboardData = {
  stats: {
    complaints: FacilityComplaintStats
    maintenance: FacilityMaintenanceStats
    technicians: FacilityTechnicianStats
    schedules: FacilityScheduleStats
  }
  pendingActions: {
    complaintsToAssign: Complaint[]
    complaintsToApprove: Complaint[]
    maintenanceToApprove: Maintenance[]
    maintenanceCostToReview: Maintenance[]
  }
  overdueSchedules: Schedule[]
  recentActivities: Array<{
    id: string
    type: "complaint" | "maintenance" | "schedule"
    title: string
    status: string
    updatedAt: string
  }>
}
