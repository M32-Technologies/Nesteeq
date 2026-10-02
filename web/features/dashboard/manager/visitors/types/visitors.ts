export type VisitorStatus = "ACTIVE" | "EXPECTED" | "CHECKED_OUT" | "DENIED"

export type VisitorEntryType = "PASS" | "MANUAL"

export interface VisitorRecord {
  id: string
  visitorName: string
  visitorPhone?: string
  unitId: string
  flatNumber: string
  residentName?: string
  residentPhone?: string
  purpose: string
  vehicleNumber?: string
  entryType: VisitorEntryType
  status: VisitorStatus
  expectedAt?: string
  checkedInAt?: string
  checkedOutAt?: string
  passCode?: string
  notes?: string
  validUntil?: string
  securityStaffName?: string
  vehicleType?: string
  parkingSlotNumber?: string
  parkingAssignmentStatus?: string
}

export interface VisitorStats {
  totalToday: number
  currentlyInside: number
  checkedOutToday: number
}

export interface VisitorFilterParams {
  search?: string
  status?: "ALL" | VisitorStatus
  entryType?: "ALL" | VisitorEntryType
  date?: string
  page: number
  limit: number
}
