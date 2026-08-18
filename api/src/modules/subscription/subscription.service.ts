import { Apartment } from "../apartment/apartment.model.js";
import Payment from "../payment/payment.model.js";
import { getSubscriptionPlan } from "./subscription.config.js";
import Subscription from "./subscription.model.js";

import { AppError } from "../../utils/AppError.js";
import {
  calculateEndDate,
  calculateInclusiveGST,
  isRazorpaySignatureValid,
  toPaise,
  type DurationUnit,
} from "../../utils/billing.js";
import {
  razorpay,
  razorpayKeySecret,
  razorpayPublicKey,
} from "../../config/razorpay.js";

interface CreateSubscriptionInput {
  apartmentId: string;
  planId: string;
}

interface VerifyPaymentInput {
  subscriptionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createSubscriptionService = async ({
  apartmentId,
  planId,
}: CreateSubscriptionInput) => {
  const apartment = await Apartment.findById(apartmentId);

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  const plan = getSubscriptionPlan(planId);

  if (!plan) {
    throw new AppError("Subscription plan not found", 404);
  }

  const now = new Date();


  await Subscription.updateMany(
    {
      apartment: apartmentId,
      status: "active",
      endDate: { $lte: now },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );


  const existingActiveSubscription = await Subscription.findOne({
    apartment: apartmentId,
    status: "active",
    endDate: { $gt: now },
  });

  if (existingActiveSubscription) {
    throw new AppError(
      "Apartment already has an active subscription",
      400
    );
  }


  if (plan.isTrial) {
    const previousFreeTrial = await Subscription.findOne({
      apartment: apartmentId,
      planId: plan.id,
    });

    if (previousFreeTrial) {
      throw new AppError(
        "Free trial has already been used for this apartment",
        400
      );
    }

    const startDate = new Date();

    const endDate = calculateEndDate(
      startDate,
      plan.durationValue,
      plan.durationUnit
    );

    const subscription = await Subscription.create({
      apartment: apartmentId,

      planId: plan.id,
      planName: plan.name,
      amount: plan.price,

      durationValue: plan.durationValue,
      durationUnit: plan.durationUnit,

      status: "active",
      paymentStatus: "not_required",

      startDate,
      endDate,
    });

    return {
      subscription,
      requiresPayment: false,
    };
  }


  const razorpayOrder = await razorpay.orders.create({
    amount: toPaise(plan.price),
    currency: "INR",
    receipt: `sub_${Date.now()}`,
    notes: {
      apartmentId,
      planId: plan.id,
    },
  });

  const subscription = await Subscription.create({
    apartment: apartmentId,

    planId: plan.id,
    planName: plan.name,
    amount: plan.price,

    durationValue: plan.durationValue,
    durationUnit: plan.durationUnit,

    status: "pending",
    paymentStatus: "pending",

    razorpayOrderId: razorpayOrder.id,
  });

  const taxBreakdown =
    calculateInclusiveGST(plan.price);

  await Payment.create({
    apartmentId,

    paymentType: "SUBSCRIPTION",
    referenceId: subscription._id,

    subtotalAmount:
      taxBreakdown.subtotalAmount,

    cgstAmount:
      taxBreakdown.cgstAmount,

    sgstAmount:
      taxBreakdown.sgstAmount,

    igstAmount:
      taxBreakdown.igstAmount,

    taxAmount:
      taxBreakdown.taxAmount,

    amount:
      taxBreakdown.totalAmount,

    currency: "INR",

    status: "PENDING",

    razorpayOrderId:
      razorpayOrder.id,
  });

  return {
    subscription,

    requiresPayment: true,

    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },

    key: razorpayPublicKey,
  };
};

export const verifySubscriptionPaymentService = async ({
  subscriptionId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: VerifyPaymentInput) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (!subscription.razorpayOrderId) {
    throw new AppError(
      "Razorpay order not found for this subscription",
      400
    );
  }

  if (subscription.razorpayOrderId !== razorpayOrderId) {
    throw new AppError("Invalid Razorpay order", 400);
  }

  if (
    subscription.status === "active" ||
    subscription.paymentStatus === "paid"
  ) {
    if (
      subscription.razorpayPaymentId ===
      razorpayPaymentId
    ) {
      return subscription;
    }

    throw new AppError(
      "Payment has already been verified with a different Razorpay payment id",
      400
    );
  }

  const isValidSignature = isRazorpaySignatureValid({
    razorpayOrderId: subscription.razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    razorpayKeySecret,
  });

  if (!isValidSignature) {
    subscription.paymentStatus = "failed";

    await subscription.save();

    await Payment.findOneAndUpdate(
      {
        razorpayOrderId,
        status: "PENDING",
      },
      {
        status: "FAILED",
      },
      {
        runValidators: true,
      }
    );

    throw new AppError(
      "Payment verification failed",
      400
    );
  }

  const payment = await Payment.findOne({
    razorpayOrderId,
  });

  if (!payment) {
    throw new AppError(
      "Payment record not found for Razorpay order",
      404
    );
  }

  if (
    payment.status === "CAPTURED" &&
    payment.razorpayPaymentId &&
    payment.razorpayPaymentId !==
      razorpayPaymentId
  ) {
    throw new AppError(
      "Payment has already been captured with a different Razorpay payment id",
      400
    );
  }

  payment.status = "CAPTURED";
  payment.razorpayPaymentId =
    razorpayPaymentId;
  payment.razorpaySignature =
    razorpaySignature;
  payment.paidAt =
    payment.paidAt || new Date();

  await payment.save();

  const startDate = new Date();

  const endDate = calculateEndDate(
    startDate,
    subscription.durationValue,
    subscription.durationUnit as DurationUnit
  );

  subscription.razorpayPaymentId = razorpayPaymentId;
  subscription.razorpaySignature = razorpaySignature;

  subscription.paymentStatus = "paid";
  subscription.status = "active";

  subscription.startDate = startDate;
  subscription.endDate = endDate;
  subscription.paidAt = new Date();

  await subscription.save();

  return subscription;
};

export const getApartmentSubscriptionService = async (
  apartmentId: string
) => {
  const apartment = await Apartment.findById(apartmentId);

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  const subscription = await Subscription.findOne({
    apartment: apartmentId,
    status: "active",
  }).sort({ createdAt: -1 });

  if (!subscription) {
    throw new AppError(
      "No active subscription found",
      404
    );
  }

  if (
    subscription.endDate &&
    subscription.endDate <= new Date()
  ) {
    subscription.status = "expired";

    await subscription.save();

    throw new AppError(
      "Subscription has expired",
      403
    );
  }

  return subscription;
};
