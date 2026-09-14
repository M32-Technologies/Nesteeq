import axiosInstance from "@/lib/axios"
import type { VisitorRecord } from "../types/visitors"

export interface ApiVisitorRecord {
  _id: string
  source: "PASS" | "VISIT"
  status: "UPCOMING" | "ACTIVE" | "EXITED"
  visitId: string | null
  visitorPassId: string | null
  apartmentId: string
  flatId?: string | null
  flatNumber?: string | null
  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null
  entryType: "PASS" | "MANUAL"
  expectedAt?: string | null
  validUntil?: string | null
  checkedInAt?: string | null
  checkedOutAt?: string | null
  parkingAssignmentId?: string | null
  parkingSlotId?: string | null
  parkingSlotNumber?: string | null
  parkingAssignmentStatus?: "ACTIVE" | "RELEASED" | null
  parkingAssignedAt?: string | null
  parkingReleasedAt?: string | null
  parkingVehicleNumber?: string | null
  parkingVehicleType?: string | null
}

export interface ApiVisitorRecordsResponse {
  records: ApiVisitorRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface GetVisitorRecordsParams {
  status?: "ALL" | "UPCOMING" | "ACTIVE" | "EXITED"
  entryType?: "ALL" | "PASS" | "MANUAL"
  search?: string
  page?: number
  limit?: number
}

export function mapApiRecordToVisitorRecord(apiRec: ApiVisitorRecord): VisitorRecord {
  let status: VisitorRecord["status"] = "CHECKED_OUT"
  if (apiRec.status === "ACTIVE") {
    status = "ACTIVE"
  } else if (apiRec.status === "UPCOMING") {
    status = "EXPECTED"
  } else if (apiRec.status === "EXITED") {
    status = "CHECKED_OUT"
  }

  return {
    id: apiRec._id,
    visitorName: apiRec.visitorName,
    visitorPhone: apiRec.visitorPhone ?? undefined,
    unitId: apiRec.flatId ?? "",
    flatNumber: apiRec.flatNumber ?? "—",
    purpose: apiRec.purpose || "Personal Visit",
    vehicleNumber: apiRec.vehicleNumber ?? undefined,
    vehicleType: apiRec.vehicleType ?? undefined,
    entryType: apiRec.entryType,
    status,
    expectedAt: apiRec.expectedAt ?? undefined,
    validUntil: apiRec.validUntil ?? undefined,
    checkedInAt: apiRec.checkedInAt ?? undefined,
    checkedOutAt: apiRec.checkedOutAt ?? undefined,
    parkingSlotNumber: apiRec.parkingSlotNumber ?? undefined,
    parkingAssignmentStatus: apiRec.parkingAssignmentStatus ?? undefined,
  }
}

export const getManagerVisitorRecords = async (
  params: GetVisitorRecordsParams = {}
) => {
  const response = await axiosInstance.get<{
    success: boolean
    message: string
    data: ApiVisitorRecordsResponse
  }>("/api/visitors/visits", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      ...(params.entryType && params.entryType !== "ALL" ? { entryType: params.entryType } : {}),
      ...(params.search ? { search: params.search } : {}),
    },
  })

  const data = response.data.data
  return {
    records: (data?.records ?? []).map(mapApiRecordToVisitorRecord),
    pagination: data?.pagination,
  }
}

export const getManagerActiveVisitors = async (page = 1, limit = 100) => {
  const response = await axiosInstance.get<{
    success: boolean
    message: string
    data: {
      visitors: ApiVisitorRecord[]
      pagination: { total: number }
    }
  }>("/api/visitors/visits/active", {
    params: { page, limit },
  })

  return response.data.data
}
