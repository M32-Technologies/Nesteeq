import type { VisitorPagination } from "./visitor.service"

export interface SecuritySummary {
  visitorsInside: number
  upcomingVisitors: number
  deliveriesWaiting: number
  availableVisitorParking: number
  activeSosAlerts: number
  reservedVisitorParking: number
  occupiedVisitorParking: number
  outOfServiceVisitorParking: number
  upcomingVisitorsToday: number
  checkedInToday: number
  checkedOutToday: number
}

export type SecurityActivityType =
  | "VISITOR_CHECKED_IN"
  | "VISITOR_CHECKED_OUT"
  | "VISITOR_MANUAL_REGISTERED"
  | "DELIVERY_RECEIVED"
  | "DELIVERY_NOTIFIED"
  | "DELIVERY_COLLECTED"
  | "DELIVERY_RETURNED"
  | "PARKING_ASSIGNED"
  | "PARKING_RELEASED"
  | "SOS_TRIGGERED"
  | "SOS_ACKNOWLEDGED"
  | "SOS_RESPONDING"
  | "SOS_RESOLVED"

export interface SecurityActivity {
  id: string
  type: SecurityActivityType
  title: string
  description: string
  timestamp: string
  status: string
  relatedEntityId: string
  actionLabel: string
  href: string
}

export interface SecurityActivityResponse {
  activities: SecurityActivity[]
}

export interface SecurityResidentSummary {
  _id: string
  userId: string
  name: string | null
  email: string | null
  phone: string | null
  residentType: string
  status: string
}

export interface SecurityFlat {
  _id: string
  flatNumber: string
  occupancyStatus: string | null
  residents: SecurityResidentSummary[]
}

export interface SecurityResidentDirectoryRecord
  extends SecurityResidentSummary {
  apartmentId: string
  flatId: string
  flatNumber: string | null
  joinedAt: string | null
}

export interface SecurityResidentsResponse {
  residents: SecurityResidentDirectoryRecord[]
  pagination: VisitorPagination
}
