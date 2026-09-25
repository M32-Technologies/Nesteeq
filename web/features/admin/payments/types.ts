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
  totalSocieties?: number
  capturedTransactions?: number
  failedTransactions?: number
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

export type PlanBreakdownItem = {
  planName: string
  planType?: string
  count: number
  percentage: number
  revenue: number
}

export type PaymentStatusDetail = {
  count: number
  percentage: number
  amount: number
}

export type BillingBreakdownData = {
  totalActiveSubscriptions: number
  plans: PlanBreakdownItem[]
  statusBreakdown: {
    captured: PaymentStatusDetail
    failed: PaymentStatusDetail
    refunded: PaymentStatusDetail
  }
}

export type TopSocietyRevenueItem = {
  apartmentId: string
  name: string
  city: string
  state: string
  totalRevenue: number
  transactionCount: number
  planName?: string
  lastPaidAt?: string | null
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
