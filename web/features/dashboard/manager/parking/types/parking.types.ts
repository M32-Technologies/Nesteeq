export type ParkingVehicleType = "CAR" | "BIKE" | "EV" | "OTHER"

export type ParkingUsageType = "RESIDENT" | "VISITOR"

export type ParkingSlotStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "OCCUPIED"
  | "INACTIVE"

export type ParkingStatusFilter = "ALL" | ParkingSlotStatus

export type ParkingUsageFilter = "ALL" | ParkingUsageType

export type ParkingVehicleFilter = "ALL" | ParkingVehicleType

export interface ParkingFlatInfo {
  _id: string
  flatNumber: string
}

export interface ParkingResidentInfo {
  _id: string
  userId?: string | null
  phoneNumber?: string | null
  residentType?: "owner" | "resident" | string | null
}

export interface ParkingSlot {
  _id: string
  apartmentId: string
  slotNumber: string
  level?: string | null
  zoneName?: string | null
  zoneCode?: string | null
  prefix?: string | null
  vehicleType: ParkingVehicleType
  usageType: ParkingUsageType
  status: ParkingSlotStatus
  flatId?: ParkingFlatInfo | null
  residentId?: ParkingResidentInfo | null
  visitorId?: string | null
  vehicleNumber?: string | null
  assignedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ParkingStats {
  total: number
  available: number
  assigned: number
  occupied: number
  inactive: number
  residentSlots: number
  visitorSlots: number
}

export interface ParkingPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ParkingSlotsListResponse {
  parkingSlots: ParkingSlot[]
  pagination: ParkingPagination
}

export type ParkingSortBy = "createdAt" | "slotNumber"
export type ParkingSortOrder = "asc" | "desc"

export type ParkingSortOption =
  | "newest"
  | "oldest"
  | "slot_asc"
  | "slot_desc"

export interface ParkingFilterParams {
  search?: string
  vehicleType?: ParkingVehicleType
  usageType?: ParkingUsageType
  status?: ParkingSlotStatus
  level?: string
  zoneCode?: string
  page?: number
  limit?: number
  sortBy?: ParkingSortBy
  sortOrder?: ParkingSortOrder
}

export interface UpdateParkingSlotInput {
  usageType?: ParkingUsageType
}

export interface AssignResidentParkingInput {
  flatId: string
  residentId?: string
  vehicleNumber: string
}

export interface generateParkingSlotsInput {
  level: string;
  zoneName?: string | null;
  usageType: "RESIDENT" | "VISITOR";
  vehicleType: "CAR" | "BIKE" | "EV" | "OTHER";
  numberOfSlots: number;
}

export type GenerateParkingSlotsInput = generateParkingSlotsInput

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

export interface GenerateParkingSlotsResponse {
  totalSlotsGenerated: number
  level: string
  zoneName: string | null
  zoneCode: string | null
  prefix: string
  generatedSlots: GeneratedParkingSlotItem[]
}