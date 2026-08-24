export type ResidentType = "owner" | "tenant" | "resident"

export type ResidentStatus = "active" | "pending" | "inactive"

export type ResidentUser = {
  id: string
  name: string
  email: string
  phone: string
  type: ResidentType
  block: string
  floor: string
  flat: string
  status: ResidentStatus
}

export type UserStats = {
  totalResidents: number
  owners: number
  tenants: number
  pendingInvites: number
}

export type ResidentListParams = {
  search?: string
  residentType?: ResidentType
  blockId?: string
  status?: ResidentStatus
  page?: number
  limit?: number
}

export type ResidentListResult = {
  residents: ResidentUser[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export type ApiResidentFlat = {
  _id?: string
  flatNumber?: string
  blockId?: string | { _id?: string; name?: string; blockName?: string }
  floorId?: string | { _id?: string; name?: string; floorName?: string }
}

export type ApiResident = {
  _id?: string
  id?: string
  userId?: string
  name?: string
  email?: string
  phone?: string | null
  residentType?: ResidentType
  type?: ResidentType
  status?: ResidentStatus
  flatId?: string | ApiResidentFlat
  user?: {
    name?: string
    email?: string
  }
}
