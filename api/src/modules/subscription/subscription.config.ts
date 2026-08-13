export const SubscriptionPlan = {
  TRIAL: "TRIAL",
  MONTHLY: "MONTHLY",
  HALF_YEARLY: "HALF_YEARLY",
  YEARLY: "YEARLY",
} as const;

export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  durationValue: number;
  durationUnit: "days" | "months" | "years";
  isTrial: boolean;
}

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  SubscriptionPlanConfig
> = {
  [SubscriptionPlan.TRIAL]: {
    id: SubscriptionPlan.TRIAL,
    name: "Free Trial",
    price: 0,
    durationValue: 14,
    durationUnit: "days",
    isTrial: true,
  },

  [SubscriptionPlan.MONTHLY]: {
    id: SubscriptionPlan.MONTHLY,
    name: "Monthly",
    price: 2000,
    durationValue: 1,
    durationUnit: "months",
    isTrial: false,
  },

  [SubscriptionPlan.HALF_YEARLY]: {
    id: SubscriptionPlan.HALF_YEARLY,
    name: "6 Months",
    price: 5000,
    durationValue: 6,
    durationUnit: "months",
    isTrial: false,
  },

  [SubscriptionPlan.YEARLY]: {
    id: SubscriptionPlan.YEARLY,
    name: "Yearly",
    price: 10000,
    durationValue: 1,
    durationUnit: "years",
    isTrial: false,
  },
};

export const getSubscriptionPlan = (
  planId: string,
): SubscriptionPlanConfig | undefined => {
  return SUBSCRIPTION_PLANS[planId as SubscriptionPlan];
};