export type ApartmentStats = {
  total: number
  active: number
  pending_payment: number
  inactive: number
}

export type ApartmentSubscription = {
  status?: string
  planSnapshot?: {
    planName?: string
    name?: string
    price?: number
    currency?: string
    planType?: string
    interval?: string
    durationMonths?: number
  }
  currentStart?: string | Date
  currentEnd?: string | Date
  cancelAtCycleEnd?: boolean
}

export type ApartmentItem = {
  _id: string
  managerId: string
  name: string
  city: string
  state: string
  address: string
  totalUnits: string
  totalFloors?: string
  totalBlocks: string
  parkingSlots: string
  contactNumber: string
  emergencyContact?: string
  status: "pending_payment" | "active" | "inactive"
  createdAt: string | Date
  updatedAt: string | Date
  currentSubscription?: ApartmentSubscription
}

export type ApartmentListResponse = {
  apartments: ApartmentItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApartmentFilterStatus = "all" | "pending_payment" | "active" | "inactive"

export type ApartmentManagerUser = {
  _id?: string
  id?: string
  name?: string
  email?: string
  phone?: string
  image?: string
  emailVerified?: boolean
  role?: string
  banned?: boolean
}

export type ApartmentDetail = ApartmentItem & {
  user?: ApartmentManagerUser | null
}

export type MonthlyRegistration = {
  period: string
  count: number
}

export type ApartmentAnalyticsData = {
  range: string
  interval: "month"
  registrations: MonthlyRegistration[]
}

