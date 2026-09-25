export type SubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired"

export type SubscriptionApartment = {
  _id: string
  name: string
  city: string
  state: string
  address?: string
  status?: string
  contactNumber?: string
}

export type SubscriptionPlanSnapshot = {
  planName?: string
  price?: number
  currency?: string
  planType?: string
  durationMonths?: number
}

export type SubscriptionItem = {
  _id: string
  apartment?: SubscriptionApartment
  planSnapshot?: SubscriptionPlanSnapshot
  status: SubscriptionStatus
  currentStart?: string | Date
  currentEnd?: string | Date
  chargeAt?: string | Date
  startAt?: string | Date
  endAt?: string | Date
  endedAt?: string | Date
  totalCount?: number
  paidCount?: number
  remainingCount?: number
  isTrial?: boolean
  trialEndsAt?: string | Date
  cancelledAt?: string | Date
  cancelReason?: string
  cancelAtCycleEnd?: boolean
  createdAt: string | Date
  updatedAt: string | Date
  razorpaySubscriptionId?: string
}

export type SubscriptionStats = {
  total: number
  created: number
  authenticated: number
  active: number
  pending: number
  halted: number
  cancelled: number
  completed: number
  expired: number
  expiringSoon: number
}

export type MonthlySubscription = {
  period: string
  count: number
}

export type SubscriptionAnalyticsData = {
  range: string
  interval: "month"
  subscriptions: MonthlySubscription[]
}

export type SubscriptionPlanDistributionItem = {
  planName: string
  count: number
  percentage: number
}

export type SubscriptionPlanDistributionData = {
  total: number
  plans: SubscriptionPlanDistributionItem[]
}

export type SubscriptionPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type SubscriptionListResponse = {
  subscriptions: SubscriptionItem[]
  pagination: SubscriptionPagination
}

export type SubscriptionFilterParams = {
  page?: number
  limit?: number
  search?: string
  status?: SubscriptionStatus
  plan?: string
  startDate?: string
  endDate?: string
  sortBy?: "createdAt" | "updatedAt" | "currentStart" | "currentEnd" | "status"
  sortOrder?: "asc" | "desc"
}
