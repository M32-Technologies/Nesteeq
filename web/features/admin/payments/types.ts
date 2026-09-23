export type PaymentStatus = "captured" | "failed" | "refunded"

export type SubscriptionPaymentItem = {
  _id: string
  apartment?: {
    _id: string
    name: string
    city?: string
    state?: string
  }
  subscription: string
  planName: string
  amount: number
  taxAmount?: number
  totalAmount?: number
  currency: string
  razorpayPaymentId: string
  razorpaySubscriptionId: string
  status: PaymentStatus
  billingCycle: number
  paidAt: string
  createdAt: string
}

export type RevenueStats = {
  totalRevenue: number
  revenueThisMonth: number
  totalTransactions: number
  activeSubscribers: number
}

export type MonthlyRevenue = {
  period: string
  revenue: number
  count: number
}

export type RevenueAnalyticsData = {
  range: string
  interval: "month"
  revenues: MonthlyRevenue[]
}

export type PaymentListResponse = {
  payments: SubscriptionPaymentItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
