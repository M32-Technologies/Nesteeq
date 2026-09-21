import type { Types } from "mongoose"
import {
  DeliveryStatus,
  DeliveryType,
  deliveryUpdateStatuses,
  type ISecurityDelivery,
} from "./delivery.interface.js"

export {
  DeliveryStatus,
  DeliveryType,
  deliveryUpdateStatuses,
  type ISecurityDelivery,
}

export type ObjectIdLike = {
  toString: () => string
}

export type LeanDelivery = ISecurityDelivery & {
  _id: ObjectIdLike
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
  residentId?: ObjectIdLike | null
}

export type CreateDeliveryInput = {
  apartmentId: string
  userId: string
  flatId: string
  residentId?: string
  deliveryType: DeliveryType
  deliveryCompany: string
  deliveryPersonName?: string
  deliveryPersonPhone?: string
  packageDescription?: string
  notes?: string
}

export type ListDeliveriesInput = {
  apartmentId: string
  status?: "ALL" | DeliveryStatus
  deliveryType?: "ALL" | DeliveryType
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export type UpdateDeliveryStatusInput = {
  apartmentId: string
  userId: string
  deliveryId: string
  status: DeliveryStatus
  notes?: string
}

export const DELIVERY_ANALYTICS_RANGES = [
  "7d",
  "30d",
  "thisMonth",
  "lastMonth",
] as const

export type DeliveryAnalyticsRange =
  (typeof DELIVERY_ANALYTICS_RANGES)[keyof typeof DELIVERY_ANALYTICS_RANGES]

export interface ResolvedDateRange {
  range: DeliveryAnalyticsRange
  start: Date
  end: Date
  startDateStr: string
  endDateStr: string
}

export interface ResolveDateRangeOptions {
  now?: Date
}

export interface DeliverySummaryStats {
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

export interface DeliveryAnalyticsResponseData {
  range: DeliveryAnalyticsRange
  dateRange: {
    start: string
    end: string
  }
  summary: DeliverySummaryStats
  activity: DeliveryActivityItem[]
}

export interface GetDeliveryAnalyticsInput {
  apartmentId: string
  range?: DeliveryAnalyticsRange
  options?: ResolveDateRangeOptions
}

export type ActivityFacetItem = {
  _id: string | null
  count: number
}

export type SummaryFacetItem = {
  _id: null
  total: number
  waiting: number
  notified: number
  collected: number
  returned: number
}

export type DeliveryAnalyticsFacetResult = {
  summary: SummaryFacetItem[]
  receivedActivity: ActivityFacetItem[]
  collectedActivity: ActivityFacetItem[]
  returnedActivity: ActivityFacetItem[]
}

export interface DeliveryResponse {
  _id: string
  apartmentId: string
  flatId: string
  flatNumber?: string | null
  residentId?: string | null
  residentName?: string | null
  residentPhone?: string | null
  deliveryType: DeliveryType
  deliveryCompany: string
  deliveryPersonName?: string | null
  deliveryPersonPhone?: string | null
  packageDescription?: string | null
  notes?: string | null
  status: DeliveryStatus
  receivedBy: string
  receivedAt: Date
  notifiedBy?: string | null
  notifiedAt?: Date | null
  collectedBy?: string | null
  collectedAt?: Date | null
  returnedBy?: string | null
  returnedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export interface DeliveryPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListDeliveriesResponse {
  deliveries: DeliveryResponse[]
  pagination: DeliveryPagination
}
