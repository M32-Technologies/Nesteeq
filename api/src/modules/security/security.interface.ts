export type ObjectIdLike = {
  toString: () => string
}

export type BetterAuthUser = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

export type LeanFlat = {
  _id: ObjectIdLike
  flatNumber: string
  occupancyStatus?: string
}

export type LeanResident = {
  _id: ObjectIdLike
  userId: string
  apartmentId: ObjectIdLike
  flatId: ObjectIdLike
  residentType: string
  phone?: string | null
  status: string
  joinedAt?: Date
}

export type ResidentSummary = {
  _id: string
  userId: string
  name: string | null
  email: string | null
  phone: string | null
  residentType: string
  status: string
}

export type FlatSummary = {
  _id: string
  flatNumber: string
  occupancyStatus: string | null
  residents: ResidentSummary[]
}

export type ResidentDirectoryRecord = ResidentSummary & {
  apartmentId: string
  flatId: string
  flatNumber: string | null
  joinedAt: Date | null
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

export type SecurityActivity = {
  id: string
  type: SecurityActivityType
  title: string
  description: string
  timestamp: Date
  status: string
  relatedEntityId: string
  actionLabel: string
  href: string
}

export type SecurityActivityQuery = {
  apartmentId: string
  limit?: number
}

export type SecuritySummary = {
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

export type SecurityResidentsQuery = {
  apartmentId: string
  search?: string
  page?: number
  limit?: number
}

export type VerifyGuestPassInput = {
  token: string
  apartmentId: string
}
