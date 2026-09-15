import type { Types } from "mongoose"

export const ParkingVehicleType = {
  CAR: "CAR",
  BIKE: "BIKE",
  EV: "EV",
  OTHER: "OTHER",
} as const

export type ParkingVehicleType =
  (typeof ParkingVehicleType)[keyof typeof ParkingVehicleType]

export const ParkingUsageType = {
  RESIDENT: "RESIDENT",
  VISITOR: "VISITOR",
} as const

export type ParkingUsageType =
  (typeof ParkingUsageType)[keyof typeof ParkingUsageType]

export const ParkingSlotStatus = {
  AVAILABLE: "AVAILABLE",
  ASSIGNED: "ASSIGNED",
  OCCUPIED: "OCCUPIED",
  INACTIVE: "INACTIVE",
} as const

export type ParkingSlotStatus =
  (typeof ParkingSlotStatus)[keyof typeof ParkingSlotStatus]

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

export interface IParkingSlot {
  apartmentId: Types.ObjectId
  level: string
  zoneName?: string | null
  zoneCode?: string | null
  prefix: string
  slotNumber: string
  vehicleType: ParkingVehicleType
  usageType: ParkingUsageType
  status: ParkingSlotStatus
  flatId?: Types.ObjectId | null
  residentId?: Types.ObjectId | null
  visitorId?: Types.ObjectId | null
  vehicleNumber?: string | null
  assignedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export interface IVisitorParkingSlot {
  apartmentId: Types.ObjectId
  slotNumber: string
  vehicleType?: ParkingVehicleType | null
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
  vehicleType?: ParkingVehicleType | null
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

export interface GeneratedParkingSlotItem {
  id: string
  slotNumber: string
  level: string
  zoneName: string | null
  zoneCode: string | null
  prefix: string
  vehicleType: ParkingVehicleType
  usageType: ParkingUsageType
  status: string
}

export interface GeneratedParkingSlotResponse {
  totalSlotsGenerated: number
  level: string
  zoneName: string | null
  zoneCode: string | null
  prefix: string
  generatedSlots: GeneratedParkingSlotItem[]
}

export interface ParkingStatsResponse {
  total: number
  available: number
  assigned: number
  occupied: number
  inactive: number
  residentSlots: number
  visitorSlots: number
}

export type LeanManagerParkingSlot = Pick<
  IParkingSlot,
  "slotNumber" | "vehicleType" | "status" | "createdAt" | "updatedAt"
> & {
  _id: Types.ObjectId
  apartmentId: Types.ObjectId
}

export type SecurityParkingListInput = {
  apartmentId: string
  status?: "ALL" | VisitorParkingSlotStatus
  vehicleType?: ParkingVehicleType
  search?: string
  page?: number
  limit?: number
}

export type DuplicateKeyError = {
  code?: number
  keyPattern?: Record<string, unknown>
}

