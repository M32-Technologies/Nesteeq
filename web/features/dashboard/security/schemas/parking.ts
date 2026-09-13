import type { ParkingVehicleType } from "../constants/parking-vehicle-types"

export type VisitorParkingSlotStatus =
  | "ALL"
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "UNAVAILABLE"

export interface VisitorParkingAssignment {
  _id: string
  flatId: string
  flatNumber: string | null
  visitorVisitId?: string | null
  guestPassId?: string | null
  visitorName: string
  vehicleNumber: string
  vehicleType?: string | null
  notes?: string | null
  assignedBy: string
  assignedAt: string
}

export interface VisitorParkingSlot {
  _id: string
  apartmentId: string
  slotNumber: string
  vehicleType?: ParkingVehicleType | null
  status: Exclude<VisitorParkingSlotStatus, "ALL">
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  currentAssignment: VisitorParkingAssignment | null
}

export interface VisitorParkingSummary {
  totalVisitorSlots: number
  available: number
  occupied: number
  reserved: number
  unavailable: number
}

export interface VisitorParkingResponse {
  summary: VisitorParkingSummary
  slots: VisitorParkingSlot[]
  pagination?: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

export interface AssignParkingPayload {
  slotId: string
  flatId: string
  visitorVisitId?: string
  visitorName: string
  vehicleNumber: string
  vehicleType: ParkingVehicleType
  notes?: string
}

export interface GenerateParkingSlotsPayload {
  prefix: string
  totalSlots: number
  startNumber: number
}

export interface UpdateParkingSlotPayload {
  slotId: string
  slotNumber: string
  notes?: string
}
