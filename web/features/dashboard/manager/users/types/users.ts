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