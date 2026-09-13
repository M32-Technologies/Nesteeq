import type { Types } from "mongoose"

export const VisitorParkingSlotStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  UNAVAILABLE: "UNAVAILABLE",
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

export type ObjectIdLike = {
  toString: () => string
}

export type LeanParkingSlot = IVisitorParkingSlot & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
}

export type LeanParkingAssignment = IVisitorParkingAssignment & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  slotId: ObjectIdLike
  flatId: ObjectIdLike
  visitorVisitId?: ObjectIdLike | null
  guestPassId?: ObjectIdLike | null
}

export type LinkedVisitorVisit = {
  _id: ObjectIdLike
  flatId: ObjectIdLike
  visitorPassId?: ObjectIdLike | null
  visitorName: string
  vehicleNumber?: string | null
}

export type ParkingSummary = {
  totalVisitorSlots: number
  available: number
  occupied: number
  reserved: number
  unavailable: number
}
