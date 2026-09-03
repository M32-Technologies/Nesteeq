import { Types } from "mongoose";
import crypto from "crypto";
import { razorpay } from "../../config/razorpay.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { Apartment } from "../apartment/apartment.model.js";
import { SubscriptionPlan } from "./subscription-plan.model.js";
import { Subscription } from "./subscription.model.js";
import { SubscriptionPlanInput } from "./subscription.schema.js";

export const CreateSubscriptionPlan = async (data: SubscriptionPlanInput) => {
  const existingPlan = await SubscriptionPlan.findOne({
    planType: data.planType,
  });

  if (existingPlan) {
    throw new AppError("Subscription plan already exists for this plan type", 409);
  }

  return SubscriptionPlan.create(data);
};

export const GetSubscriptionPlans = async () => {
  return SubscriptionPlan.find({ isActive: true })
    .sort({ durationMonths: 1, price: 1 })
    .lean();
};

function getTotalCount(planType: string): number {
  switch (planType) {
    case "MONTHLY":
      return 120;
    case "SIX_MONTHS":
      return 20;
    case "YEARLY":
      return 10;
    default:
      throw new AppError("Invalid subscription plan type", 400);
  }
}

const getSubscriptionCheckoutPayload = (subscription: {
  razorpaySubscriptionId: string;
  _id: unknown;
}) => {
  return {
    subscriptionId: subscription.razorpaySubscriptionId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    dbSubscriptionId: subscription._id,
  };
};

export const CreateSubscription = async (
  planId: string,
  apartmentId: string,
  userId: string,
) => {
  if (!Types.ObjectId.isValid(planId)) {
    throw new AppError("Invalid subscription plan id", 400);
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartment id", 400);
  }

  const plan = await SubscriptionPlan.findById(planId);

  if (!plan || !plan.isActive) {
    throw new AppError("Plan not found or inactive", 404);
  }

  if (!plan.razorpayPlanId) {
    throw new AppError("Plan is not linked to a Razorpay plan yet", 400);
  }

  const existingSubscription = await Subscription.findOne({
    apartment: apartmentId,
    status: {
      $in: ["created", "authenticated", "active", "pending", "halted"],
    },
  });

  if (existingSubscription) {
    const isSamePlan = existingSubscription.plan.toString() === plan._id.toString();
    const hasNoCapturedPayment = Number(existingSubscription.paidCount ?? 0) === 0;
    const canRetryCheckout =
      isSamePlan &&
      hasNoCapturedPayment &&
      ["created", "authenticated", "pending", "halted"].includes(
        existingSubscription.status,
      );

    if (canRetryCheckout) {
      return getSubscriptionCheckoutPayload(existingSubscription);
    }

    throw new AppError(
      "This apartment already has an active or pending subscription",
      409,
    );
  }

  const totalCount = getTotalCount(plan.planType);
  const trialDays = plan.freeTrial?.days ?? 0;
  const isTrial = Boolean(plan.freeTrial?.enabled && trialDays > 0);
  const startAt = isTrial
    ? Math.floor((Date.now() + trialDays * 24 * 60 * 60 * 1000) / 1000)
    : undefined;

  const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    total_count: totalCount,
    customer_notify: true,
    ...(startAt ? { start_at: startAt } : {}),
    notes: {
      apartmentId,
      planId: plan._id.toString(),
      userId,
    },
  });

  const paidCount = Number(razorpaySubscription.paid_count ?? 0);
  const remainingCount = Number(
    razorpaySubscription.remaining_count ?? totalCount,
  );

  const subscriptionDoc = await Subscription.create({
    apartment: apartmentId,
    plan: plan._id,
    subscribedBy: userId,
    razorpaySubscriptionId: razorpaySubscription.id,
    razorpayPlanId: plan.razorpayPlanId,
    razorpayCustomerId: razorpaySubscription.customer_id ?? undefined,
    status: razorpaySubscription.status ?? "created",
    totalCount,
    paidCount,
    remainingCount,
    isTrial,
    trialEndsAt: isTrial && startAt ? new Date(startAt * 1000) : undefined,
    planSnapshot: {
      planName: plan.planName,
      price: plan.price,
      planType: plan.planType,
      durationMonths: plan.durationMonths,
    },
    notes: razorpaySubscription.notes,
  });

  return {
    ...getSubscriptionCheckoutPayload(subscriptionDoc),
  };
};

export const VerifySubscriptionPayment = async (
  razorpay_payment_id: string,
  razorpay_subscription_id: string,
  razorpay_signature: string,
) => {
  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: razorpay_subscription_id,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.razorPaySecret)
    .update(`${razorpay_payment_id}|${subscription.razorpaySubscriptionId}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new AppError(
      "Payment verification failed - invalid signature",
      400,
    );
  }

  const razorpaySubscription = await razorpay.subscriptions.fetch(
    subscription.razorpaySubscriptionId,
  );

  if (razorpaySubscription.status) {
    subscription.status = razorpaySubscription.status as
      | "created"
      | "authenticated"
      | "active"
      | "pending"
      | "halted"
      | "cancelled"
      | "completed"
      | "expired";
  }

  subscription.paidCount = Number(razorpaySubscription.paid_count ?? 0);

  subscription.remainingCount = Number(
    razorpaySubscription.remaining_count ?? 0,
  );

  subscription.razorpayCustomerId = razorpaySubscription.customer_id ?? null;

  subscription.currentStart = razorpaySubscription.current_start
    ? new Date(Number(razorpaySubscription.current_start) * 1000)
    : undefined;

  subscription.currentEnd = razorpaySubscription.current_end
    ? new Date(Number(razorpaySubscription.current_end) * 1000)
    : undefined;

  subscription.chargeAt = razorpaySubscription.charge_at
    ? new Date(Number(razorpaySubscription.charge_at) * 1000)
    : undefined;

  subscription.startAt = razorpaySubscription.start_at
    ? new Date(Number(razorpaySubscription.start_at) * 1000)
    : undefined;

  subscription.endAt = razorpaySubscription.end_at
    ? new Date(Number(razorpaySubscription.end_at) * 1000)
    : undefined;

  subscription.endedAt = razorpaySubscription.ended_at
    ? new Date(Number(razorpaySubscription.ended_at) * 1000)
    : undefined;

  await subscription.save();

  if (
    subscription.status === "active" ||
    subscription.status === "authenticated" ||
    Number(subscription.paidCount ?? 0) > 0
  ) {
    await Apartment.updateOne(
      {
        _id: subscription.apartment,
        status: "pending_payment",
      },
      {
        $set: {
          status: "active",
        },
      },
    );
  }

  return {
    verified: true,
    subscriptionId: subscription._id,
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    razorpayPaymentId: razorpay_payment_id,
    status: subscription.status,
  };
};
