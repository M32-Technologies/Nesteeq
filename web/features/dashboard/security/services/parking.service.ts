import axiosInstance from "@/lib/axios"

export type VisitorParkingSlotStatus =
  | "ALL"
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "OUT_OF_SERVICE"

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
  status: Exclude<VisitorParkingSlotStatus, "ALL">
  notes?: string | null
  currentAssignment: VisitorParkingAssignment | null
}

export interface VisitorParkingSummary {
  totalVisitorSlots: number
  available: number
  occupied: number
  reserved: number
  outOfService: number
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
  vehicleType?: string
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

export const getParkingSlots = async (params: {
  status?: VisitorParkingSlotStatus
  search?: string
  page?: number
  limit?: number
}) => {
  const response = await axiosInstance.get(
    "/api/security/parking",
    {
      params,
    }
  )

  return response.data.data as VisitorParkingResponse
}

export const createParkingSlot = async (payload: {
  slotNumber: string
  status?: Exclude<VisitorParkingSlotStatus, "ALL" | "OCCUPIED">
  notes?: string
}) => {
  const response = await axiosInstance.post(
    "/api/security/parking",
    payload
  )

  return response.data.data as VisitorParkingSlot
}

export const assignParkingSlot = async (
  payload: AssignParkingPayload
) => {
  const response = await axiosInstance.post(
    "/api/security/parking/assign",
    payload
  )

  return response.data.data as VisitorParkingResponse
}

export const updateParkingSlotStatus = async ({
  slotId,
  status,
  notes,
}: {
  slotId: string
  status: Exclude<VisitorParkingSlotStatus, "ALL" | "OCCUPIED">
  notes?: string
}) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}/status`,
    {
      status,
      notes,
    }
  )

  return response.data.data as VisitorParkingSlot
}

export const releaseParkingSlot = async (slotId: string) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}/release`
  )

  return response.data.data as VisitorParkingSlot
}

export const generateParkingSlots = async (
  payload: GenerateParkingSlotsPayload
) => {
  const response = await axiosInstance.post(
    "/api/security/parking/generate",
    payload
  )

  return response.data.data as VisitorParkingResponse
}

export const updateParkingSlot = async ({
  slotId,
  slotNumber,
  notes,
}: UpdateParkingSlotPayload) => {
  const response = await axiosInstance.patch(
    `/api/security/parking/${slotId}`,
    {
      slotNumber,
      notes,
    }
  )

  return response.data.data as VisitorParkingSlot
}
