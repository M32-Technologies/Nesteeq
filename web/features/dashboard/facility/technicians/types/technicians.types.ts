import type {
  Pagination,
  TechnicianStatus,
} from "@/features/dashboard/facility/shared/types/common.types"

export type { TechnicianStatus } from "@/features/dashboard/facility/shared/types/common.types"

export type Technician = {
  _id: string
  name: string
  email?: string
  phone?: string
  role?: string
  status: TechnicianStatus
  specialization?: string[]
  assignedTaskCount?: number
  createdAt: string
  updatedAt: string
}

export type TechnicianQuery = {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export type TechniciansListData = {
  technicians: Technician[]
  pagination: Pagination
}

export type CreateTechnicianPayload = {
  name: string
  email?: string
  phone?: string
  specialization?: string[]
}

export type UpdateTechnicianPayload = {
  name?: string
  email?: string
  phone?: string
  specialization?: string[]
  status?: TechnicianStatus
}

export type FacilityTechnicianStats = {
  total: number
  active: number
  busy: number
  onLeave: number
  inactive: number
}
