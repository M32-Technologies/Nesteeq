export type SubscriptionPlanType = | "MONTHLY" | "SIX_MONTHS" | "YEARLY";

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

export interface CreateSubscriptionResult {
  subscriptionId: string;
  razorpayKeyId: string;
  dbSubscriptionId: string;
}

export type CreateSubscriptionResponse =
  ApiResponse<CreateSubscriptionResult>;

export interface VerifySubscriptionPaymentInput {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface VerifySubscriptionPaymentResult {
  verified: boolean;
  subscriptionId: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  status: string;
}

export type VerifySubscriptionPaymentResponse =
  ApiResponse<VerifySubscriptionPaymentResult>;
