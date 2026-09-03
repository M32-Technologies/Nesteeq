import type { Types } from "mongoose"

export const VisitorParkingSlotStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  OUT_OF_SERVICE: "OUT_OF_SERVICE",
} as const

export type VisitorParkingSlotStatus =
  (typeof VisitorParkingSlotStatus)[keyof typeof VisitorParkingSlotStatus]

export const VisitorParkingAssignmentStatus = {
  ACTIVE: "ACTIVE",
  RELEASED: "RELEASED",
} as const

export type VisitorParkingAssignmentStatus =
  (typeof VisitorParkingAssignmentStatus)[keyof typeof VisitorParkingAssignmentStatus]

export interface IVisitorParkingSlot {
  apartmentId: Types.ObjectId
  slotNumber: string
  status: VisitorParkingSlotStatus
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface IVisitorParkingAssignment {
  apartmentId: Types.ObjectId
  slotId: Types.ObjectId
  flatId: Types.ObjectId
  visitorVisitId?: Types.ObjectId | null
  guestPassId?: Types.ObjectId | null
  visitorName: string
  vehicleNumber: string
  vehicleType?: string | null
  notes?: string | null
  status: VisitorParkingAssignmentStatus
  assignedBy: string
  assignedAt: Date
  releasedBy?: string | null
  releasedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}
