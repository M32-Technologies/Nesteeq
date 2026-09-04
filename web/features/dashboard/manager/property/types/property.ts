export type PropertyBlockStatus = "active" | "inactive"

export type PropertyBlockFilterStatus = "all" | PropertyBlockStatus

export type PropertyOccupancyStatus = "VACANT" | "OWNER" | "TENANT"

export type PropertyFlatStatus = "active" | "inactive"

export type PropertyTab = "blocks" | "flats"

export type PropertyApartment = {
  id: string
  name: string
  totalBlocks: number
  totalUnits: number
  status: string
}

export type PropertyBlock = {
  id: string
  apartmentId: string
  blockname: string
  code: string
  totalFloors: number
  status: PropertyBlockStatus
  createdAt?: string | null
  updatedAt?: string | null
}

export type PropertyFlat = {
  id: string
  apartmentId: string
  blockId: string
  block?: {
    id: string
    blockname: string
    code: string
  }
  residentId?: string | null
  resident?: PropertyFlatResident | null
  floorNumber: number
  flatNumber: string
  occupancyStatus: PropertyOccupancyStatus
  status: PropertyFlatStatus
  createdAt?: string | null
  updatedAt?: string | null
}

export type PropertyBlockListParams = {
  status?: PropertyBlockStatus
}

export type PropertyFlatResident = {
  id: string
  userId?: string | null
  name: string
  email?: string | null
  emailVerified?: boolean
  image?: string | null
  role?: string
  residentType?: "owner" | "resident"
  phone?: string | null
  status?: string
  joinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type CreatePropertyBlockInput = {
  blockname: string
  code: string
  totalFloors: number
}

export type UpdatePropertyBlockInput = {
  blockname?: string
  code?: string
  totalFloors?: number
  status?: PropertyBlockStatus
}

export type CreatePropertyFlatInput = {
  blockId: string
  floorNumber: number
  flatNumber: string
}

export type UpdatePropertyFlatInput = {
  floorNumber?: number
  flatNumber?: string
}

export type UpdatePropertyFlatStatusInput = {
  status: PropertyFlatStatus
}

export type GeneratePropertyFlatsInput = {
  blockId: string
  unitsPerFloor: number
}

export type GeneratePropertyFlatsResult = {
  blockId: string
  blockName: string
  blockCode: string
  totalFloors: number
  unitsPerFloor: number
  totalFlatsGenerated: number
}

export type PropertyFlatListParams = {
  search?: string
  blockId?: string
  floorNumber?: string | number
  occupancyStatus?: PropertyOccupancyStatus
  status?: PropertyFlatStatus
  page?: number
  limit?: number
  sortBy?:
    | "flatNumber"
    | "floorNumber"
    | "occupancyStatus"
    | "status"
    | "createdAt"
    | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export type PropertyFlatListResult = {
  flats: PropertyFlat[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type PropertyStats = {
  totalBlocks: number
  apartmentTotalBlocks: number
  totalFlats: number
  occupiedFlats: number
  vacantFlats: number
}

export type FlatAdvancedFilters = {
  floorNumber: string
  occupancyStatus: "all" | PropertyOccupancyStatus
  status: "all" | PropertyFlatStatus
  sortBy: NonNullable<PropertyFlatListParams["sortBy"]>
  sortOrder: NonNullable<PropertyFlatListParams["sortOrder"]>
}
