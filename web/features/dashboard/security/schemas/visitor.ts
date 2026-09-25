export interface VisitorPass {
  _id: string
  apartmentId: string
  flatId: string
  flatNumber?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  validFrom: string
  validUntil: string
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "USED"
  usedAt?: string | null
  usedBy?: string | null
}

export interface VisitorVisit {
  _id: string
  apartmentId: string
  flatId?: string
  flatNumber?: string | null
  visitorPassId?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: "PASS" | "MANUAL"
  checkedInBy: string
  checkedInAt: string
  checkedOutBy?: string | null
  checkedOutAt?: string | null
  status: "ACTIVE" | "CHECKED_OUT"
}

export interface VisitorPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ActiveVisitorsResponse {
  visitors: VisitorVisit[]
  pagination: VisitorPagination
}

export interface VisitorHistoryResponse {
  visits: VisitorVisit[]
  pagination: VisitorPagination
}

export type VisitorRecordStatus =
  | "ALL"
  | "UPCOMING"
  | "ACTIVE"
  | "EXITED"

export type VisitorRecordEntryType =
  | "ALL"
  | "PASS"
  | "MANUAL"

export interface VisitorRecord {
  _id: string
  source: "PASS" | "VISIT"
  status: Exclude<VisitorRecordStatus, "ALL">
  visitId: string | null
  visitorPassId: string | null
  apartmentId: string
  flatId?: string | null
  flatNumber?: string | null
  residentName?: string | null
  residentPhone?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: Exclude<VisitorRecordEntryType, "ALL">
  expectedAt?: string | null
  validUntil?: string | null
  checkedInAt?: string | null
  checkedOutAt?: string | null
  parkingAssignmentId?: string | null
  parkingSlotId?: string | null
  parkingSlotNumber?: string | null
  parkingAssignmentStatus?: "ACTIVE" | "RELEASED" | null
  parkingAssignedAt?: string | null
  parkingReleasedAt?: string | null
  parkingVehicleNumber?: string | null
  parkingVehicleType?: string | null
}

export interface VisitorRecordsResponse {
  records: VisitorRecord[]
  pagination: VisitorPagination
}

export interface VisitorRecordsParams {
  status?: VisitorRecordStatus
  entryType?: VisitorRecordEntryType
  search?: string
  page?: number
  limit?: number
}

export interface ManualVisitorInput {
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
  vehicleType?: string
  parkingSlotId?: string
}

export interface CheckInVisitorInput {
  visitorPassId?: string
  token?: string
}
