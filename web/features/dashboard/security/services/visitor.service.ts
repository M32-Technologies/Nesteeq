import axiosInstance from "@/lib/axios"

export interface VisitorPass {
  _id: string
  apartmentId: string
  flatId: string
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  validFrom: string
  validUntil: string
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "USED"
  usedAt?: string | null
  usedBy?: string | null
}

export interface VisitorVisit {
  _id: string
  apartmentId: string
  flatId: string
  visitorPassId?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  entryType: "PASS" | "MANUAL"
  checkedInBy: string
  checkedInAt: string
  checkedOutBy?: string | null
  checkedOutAt?: string | null
  status: "ACTIVE" | "CHECKED_OUT"
}

export interface VisitorPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ActiveVisitorsResponse {
  visitors: VisitorVisit[]
  pagination: VisitorPagination
}

export interface VisitorHistoryResponse {
  visits: VisitorVisit[]
  pagination: VisitorPagination
}

export type VisitorRecordStatus =
  | "ALL"
  | "UPCOMING"
  | "ACTIVE"
  | "EXITED"

export type VisitorRecordEntryType =
  | "ALL"
  | "PASS"
  | "MANUAL"

export interface VisitorRecord {
  _id: string
  source: "PASS" | "VISIT"
  status: Exclude<VisitorRecordStatus, "ALL">
  visitId: string | null
  visitorPassId: string | null
  apartmentId: string
  flatId: string
  flatNumber?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  entryType: Exclude<VisitorRecordEntryType, "ALL">
  expectedAt?: string | null
  validUntil?: string | null
  checkedInAt?: string | null
  checkedOutAt?: string | null
}

export interface VisitorRecordsResponse {
  records: VisitorRecord[]
  pagination: VisitorPagination
}

export interface VisitorRecordsParams {
  status?: VisitorRecordStatus
  entryType?: VisitorRecordEntryType
  search?: string
  page?: number
  limit?: number
}

export interface ManualVisitorInput {
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
}

export const verifyVisitorPass = async (token: string) => {
  const response = await axiosInstance.post("/api/security/verify-pass", {
    token,
  })

  return response.data.data as VisitorPass
}

export const checkInVisitor = async (visitorPassId: string) => {
  const response = await axiosInstance.post(
    "/api/visitors/visits/check-in",
    {
      visitorPassId,
    }
  )

  return response.data.data as VisitorVisit
}

export const registerManualVisitor = async (
  data: ManualVisitorInput
) => {
  const response = await axiosInstance.post(
    "/api/visitors/visits/manual",
    data
  )

  return response.data.data as VisitorVisit
}

export const getVisitorRecords = async (
  params: VisitorRecordsParams
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits",
    {
      params,
    }
  )

  return response.data.data as VisitorRecordsResponse
}

export const getActiveVisitors = async (
  page = 1,
  limit = 10
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits/active",
    {
      params: {
        page,
        limit,
      },
    }
  )

  return response.data.data as ActiveVisitorsResponse
}

export const checkoutVisitor = async (visitId: string) => {
  const response = await axiosInstance.patch(
    `/api/visitors/visits/${visitId}/check-out`
  )

  return response.data.data as VisitorVisit
}

export const getVisitorHistory = async (
  page = 1,
  limit = 10
) => {
  const response = await axiosInstance.get(
    "/api/visitors/visits/history",
    {
      params: {
        page,
        limit,
      },
    }
  )

  return response.data.data as VisitorHistoryResponse
}
