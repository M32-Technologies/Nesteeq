import type {
  CheckoutPlanId,
  PlanId,
  SelectedPlan,
} from "../types/payment.types";

export const DEFAULT_PLAN: SelectedPlan = {
  planId: "MONTHLY",
  name: "1 Month Plan",
  duration: "1 Month",
  amount: 2000,
};

export const CHECKOUT_PLAN_IDS = [
  "MONTHLY",
  "HALF_YEARLY",
  "YEARLY",
] as const satisfies readonly CheckoutPlanId[];

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/$/, "");

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const isCheckoutPlanId = (
  value: unknown
): value is CheckoutPlanId => {
  return (
    typeof value === "string" &&
    CHECKOUT_PLAN_IDS.includes(
      value as CheckoutPlanId
    )
  );
};

export const normalizeStoredPlanId = (
  value: unknown
): PlanId | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "TRIAL") {
    return "TRIAL";
  }

  if (isCheckoutPlanId(normalized)) {
    return normalized;
  }

  if (
    normalized.includes("1_MONTH") ||
    normalized.includes("MONTHLY")
  ) {
    return "MONTHLY";
  }

  if (
    normalized.includes("6_MONTH") ||
    normalized.includes("HALF_YEAR")
  ) {
    return "HALF_YEARLY";
  }

  if (normalized.includes("YEAR")) {
    return "YEARLY";
  }

  return null;
};

export const getCheckoutPlanId = (
  planId: PlanId
): CheckoutPlanId => {
  return isCheckoutPlanId(planId)
    ? planId
    : "MONTHLY";
};
