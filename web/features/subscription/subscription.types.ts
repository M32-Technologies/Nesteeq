export type SubscriptionPlanType =| "MONTHLY" | "SIX_MONTHS" | "YEARLY";

export interface SubscriptionFreeTrial {
  enabled: boolean;
  days: number;
}

export interface SubscriptionPlan {
  _id: string;
  planName: string;
  price: number;
  planType: SubscriptionPlanType;
  durationMonths: number;
  features: string[];
  freeTrial: SubscriptionFreeTrial;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type SubscriptionPlansResponse =
  ApiResponse<SubscriptionPlan[]>;