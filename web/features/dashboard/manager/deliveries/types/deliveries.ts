export type DeliveryStatus =
  | "WAITING"
  | "NOTIFIED"
  | "COLLECTED"
  | "RETURNED"

export type DeliveryType =
  | "PARCEL"
  | "FOOD"
  | "GROCERY"
  | "COURIER"
  | "OTHER"

export type DeliveryAnalyticsRange = "7d" | "30d" | "thisMonth" | "lastMonth"

export interface DeliveryRecord {
  id: string
  flatId?: string
  flatNumber: string
  residentId?: string | null
  residentName?: string | null
  residentPhone?: string | null
  deliveryCompany: string
  deliveryPersonName?: string | null
  deliveryPersonPhone?: string | null
  deliveryType: DeliveryType
  packageDescription?: string | null
  notes?: string | null
  status: DeliveryStatus
  receivedBy: string
  receivedAt: string
  notifiedBy?: string | null
  notifiedAt?: string | null
  collectedBy?: string | null
  collectedAt?: string | null
  returnedBy?: string | null
  returnedAt?: string | null
}

export interface DeliveryStats {
  total: number
  waiting: number
  notified: number
  collected: number
  returned: number
}

export interface DeliveryActivityItem {
  date: string
  received: number
  collected: number
  returned: number
}

export interface DeliveryAnalyticsData {
  range: DeliveryAnalyticsRange
  dateRange: {
    start: string
    end: string
  }
  summary: DeliveryStats
  activity: DeliveryActivityItem[]
}

export interface GetDeliveriesParams {
  page?: number
  limit?: number
  status?: string
  deliveryType?: string
  search?: string
  startDate?: string
  endDate?: string
}

export interface DeliveriesPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DeliveriesApiResponse {
  deliveries: DeliveryRecord[]
  pagination: DeliveriesPagination
}
