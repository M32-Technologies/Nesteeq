import axiosInstance from "@/lib/axios"
import type {
  DeliveriesApiResponse,
  DeliveryAnalyticsData,
  DeliveryAnalyticsRange,
  DeliveryRecord,
  GetDeliveriesParams,
} from "../types/deliveries"

interface ApiDeliveryRecord {
  _id: string
  apartmentId: string
  flatId: string
  flatNumber?: string | null
  residentId?: string | null
  residentName?: string | null
  residentPhone?: string | null
  deliveryCompany: string
  deliveryPersonName?: string | null
  deliveryPersonPhone?: string | null
  deliveryType: string
  packageDescription?: string | null
  notes?: string | null
  status: string
  receivedBy: string
  receivedAt: string
  notifiedBy?: string | null
  notifiedAt?: string | null
  collectedBy?: string | null
  collectedAt?: string | null
  returnedBy?: string | null
  returnedAt?: string | null
}

function mapApiDelivery(api: ApiDeliveryRecord): DeliveryRecord {
  return {
    id: api._id,
    flatId: api.flatId,
    flatNumber: api.flatNumber || "—",
    residentId: api.residentId,
    residentName: api.residentName,
    residentPhone: api.residentPhone,
    deliveryCompany: api.deliveryCompany,
    deliveryPersonName: api.deliveryPersonName,
    deliveryPersonPhone: api.deliveryPersonPhone,
    deliveryType: (api.deliveryType || "PARCEL") as DeliveryRecord["deliveryType"],
    packageDescription: api.packageDescription,
    notes: api.notes,
    status: (api.status || "WAITING") as DeliveryRecord["status"],
    receivedBy: api.receivedBy,
    receivedAt: api.receivedAt,
    notifiedBy: api.notifiedBy,
    notifiedAt: api.notifiedAt,
    collectedBy: api.collectedBy,
    collectedAt: api.collectedAt,
    returnedBy: api.returnedBy,
    returnedAt: api.returnedAt,
  }
}

export const getManagerDeliveries = async (
  params: GetDeliveriesParams = {}
): Promise<DeliveriesApiResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  }

  if (params.status && params.status !== "ALL") {
    queryParams.status = params.status
  }
  if (params.deliveryType && params.deliveryType !== "ALL") {
    queryParams.deliveryType = params.deliveryType
  }
  if (params.search?.trim()) {
    queryParams.search = params.search.trim()
  }
  if (params.startDate) {
    queryParams.startDate = params.startDate
  }
  if (params.endDate) {
    queryParams.endDate = params.endDate
  }

  const response = await axiosInstance.get<{
    success: boolean
    message: string
    data: {
      deliveries: ApiDeliveryRecord[]
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }
  }>("/api/deliveries", {
    params: queryParams,
  })

  const rawData = response.data.data

  return {
    deliveries: (rawData?.deliveries ?? []).map(mapApiDelivery),
    pagination: rawData?.pagination ?? {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  }
}

export const getManagerDeliveryAnalytics = async (
  range: DeliveryAnalyticsRange = "7d"
): Promise<DeliveryAnalyticsData> => {
  const response = await axiosInstance.get<{
    success: boolean
    message: string
    data: DeliveryAnalyticsData
  }>("/api/deliveries/analytics", {
    params: { range },
  })

  return response.data.data
}
