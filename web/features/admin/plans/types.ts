export type SubscriptionPlan = {
  _id: string
  planName: string
  price: number
  planType: string
  durationMonths: number
  features: string[]
  freeTrial: {
    enabled: boolean
    days: number
  }
  razorpayPlanId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PlanListResponse = {
  plans: SubscriptionPlan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreatePlanInput = {
  planName: string
  price: number
  planType: string
  durationMonths: number
  features?: string[]
  freeTrial?: {
    enabled: boolean
    days: number
  }
  razorpayPlanId: string
}

export type UpdatePlanInput = {
  planName?: string
  price?: number
  planType?: string
  durationMonths?: number
  features?: string[]
  freeTrial?: {
    enabled: boolean
    days: number
  }
  razorpayPlanId?: string
}

export type PlanFilterStatus = "all" | "active" | "inactive"
