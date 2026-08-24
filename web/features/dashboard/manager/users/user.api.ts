import api from "@/lib/axios"

import type {
  ApiResident,
  ApiResidentFlat,
  ResidentListParams,
  ResidentListResult,
  ResidentUser,
} from "./types/users"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ResidentListApiData = {
  residents: ApiResident[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

export const getResidents = async (
  params: ResidentListParams = {}
): Promise<ResidentListResult> => {
  const response = await api.get<ApiResponse<ResidentListApiData>>(
    "/api/v1/residents",
    {
      params: cleanResidentParams(params),
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch residents")
  }

  return {
    ...response.data.data,
    residents: response.data.data.residents.map(mapResident),
  }
}

const cleanResidentParams = (params: ResidentListParams) => ({
  search: params.search?.trim() || undefined,
  residentType: params.residentType,
  blockId: params.blockId,
  status: params.status,
  page: params.page,
  limit: params.limit,
})

const mapResident = (resident: ApiResident): ResidentUser => {
  const flat =
    typeof resident.flatId === "object" && resident.flatId
      ? resident.flatId
      : undefined

  return {
    id: resident._id || resident.id || resident.userId || "-",
    name: resident.user?.name || resident.name || "Unknown user",
    email: resident.user?.email || resident.email || "-",
    phone: resident.phone || "-",
    type: resident.residentType || resident.type || "resident",
    block: getBlockName(flat),
    floor: getFloorName(flat),
    flat: flat?.flatNumber || "-",
    status: resident.status || "active",
  }
}

const getBlockName = (flat?: ApiResidentFlat) => {
  if (!flat?.blockId) return "-"
  if (typeof flat.blockId === "string") return flat.blockId

  return flat.blockId.name || flat.blockId.blockName || flat.blockId._id || "-"
}

const getFloorName = (flat?: ApiResidentFlat) => {
  if (!flat?.floorId) return "-"
  if (typeof flat.floorId === "string") return flat.floorId

  return flat.floorId.name || flat.floorId.floorName || flat.floorId._id || "-"
}
