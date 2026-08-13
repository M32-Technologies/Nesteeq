import crypto from "crypto";
import { Apartment } from "../apartment/apartment.model.js";
import { getSubscriptionPlan } from "../subscription/subscription.config.js";
import Subscription from "../subscription/subscription.model.js";
import Payment from "./payment.model.js";

import {
  razorpay,
  razorpayKeySecret,
  razorpayPublicKey,
} from "../../config/razorpay.js";
import { AppError } from "../../utils/AppError.js";

import type { PaymentType } from "./payment.interface.js";

interface CreatePaymentOrderInput {
  userId: string;
  apartmentId: string;
  referenceId: string;
  paymentType: PaymentType;
  totalAmount: number;
}

interface TaxBreakdown {
  subtotalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface VerifyCheckoutInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface CreateCheckoutOrderInput {
  apartmentId: string;
  planId: TestPlanId;
  subscriptionId?: string;
  userId?: string;
}

export type TestPlanId =
  | "MONTHLY"
  | "HALF_YEARLY"
  | "YEARLY";

const roundAmount = (amount: number) => {
  return Number(amount.toFixed(2));
};

export const calculateInclusiveGST = (
  totalAmount: number,
  gstRate = 18
): TaxBreakdown => {
  const subtotalAmount = roundAmount(
    totalAmount / (1 + gstRate / 100)
  );

  const taxAmount = roundAmount(
    totalAmount - subtotalAmount
  );

  const cgstAmount = roundAmount(
    taxAmount / 2
  );

  const sgstAmount = roundAmount(
    taxAmount - cgstAmount
  );

  return {
    subtotalAmount,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    taxAmount,
    totalAmount: roundAmount(totalAmount),
  };
};

const calculateSubscriptionEndDate = (
  startDate: Date,
  durationValue: number,
  durationUnit: "days" | "months" | "years"
) => {
  const endDate = new Date(startDate);

  if (durationUnit === "days") {
    endDate.setDate(endDate.getDate() + durationValue);
  }

  if (durationUnit === "months") {
    endDate.setMonth(endDate.getMonth() + durationValue);
  }

  if (durationUnit === "years") {
    endDate.setFullYear(endDate.getFullYear() + durationValue);
  }

  return endDate;
};

const buildPaymentPayload = ({
  apartmentId,
  userId,
  referenceId,
  paymentType,
  taxBreakdown,
  razorpayOrderId,
}: {
  apartmentId: string;
  userId?: string;
  referenceId: string;
  paymentType: PaymentType;
  taxBreakdown: TaxBreakdown;
  razorpayOrderId: string;
}) => {
  const payload: Record<string, unknown> = {
    apartmentId,
    paymentType,
    referenceId,
    subtotalAmount: taxBreakdown.subtotalAmount,
    cgstAmount: taxBreakdown.cgstAmount,
    sgstAmount: taxBreakdown.sgstAmount,
    igstAmount: taxBreakdown.igstAmount,
    taxAmount: taxBreakdown.taxAmount,
    amount: taxBreakdown.totalAmount,
    currency: "INR",
    status: "PENDING",
    razorpayOrderId,
  };

  if (userId) {
    payload.userId = userId;
  }

  return payload;
};



export const createPaymentOrderService = async ({
  userId,
  apartmentId,
  referenceId,
  paymentType,
  totalAmount,
}: CreatePaymentOrderInput) => {
  if (totalAmount <= 0) {
    throw new AppError(
      "Payment amount must be greater than zero",
      400
    );
  }

  const taxBreakdown =
    calculateInclusiveGST(totalAmount);

  const razorpayOrder =
    await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),

      currency: "INR",

      receipt: `pay_${referenceId}`,

      notes: {
        userId,
        apartmentId,
        referenceId,
        paymentType,
      },
    });

  const payment = await Payment.create({
    userId,
    apartmentId,

    paymentType,
    referenceId,

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
    paymentId: payment._id,

    paymentType,

    pricing: {
      subtotalAmount:
        payment.subtotalAmount,

      cgstAmount:
        payment.cgstAmount,

      sgstAmount:
        payment.sgstAmount,

      igstAmount:
        payment.igstAmount,

      taxAmount:
        payment.taxAmount,

      totalAmount:
        payment.amount,

      currency:
        payment.currency,
    },

    razorpayOrder: {
      id:
        razorpayOrder.id,

      amount:
        razorpayOrder.amount,

      currency:
        razorpayOrder.currency,
    },
  };
};

export const createCheckoutOrderService = async ({
  apartmentId,
  planId,
  subscriptionId,
  userId,
}: CreateCheckoutOrderInput) => {
  const apartment = await Apartment.findById(apartmentId);

  if (!apartment) {
    throw new AppError("Apartment not found", 404);
  }

  const plan = getSubscriptionPlan(planId);

  if (!plan || plan.isTrial) {
    throw new AppError(
      "Invalid subscription plan",
      400
    );
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

  const existingActiveSubscription =
    await Subscription.findOne({
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

  let subscription = subscriptionId
    ? await Subscription.findById(subscriptionId)
    : await Subscription.findOne({
        apartment: apartmentId,
        planId: plan.id,
        status: "pending",
        paymentStatus: "pending",
      }).sort({ createdAt: -1 });

  if (subscriptionId && !subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (
    subscription &&
    subscription.apartment.toString() !== apartmentId
  ) {
    throw new AppError(
      "Subscription does not belong to this apartment",
      400
    );
  }

  if (subscription && subscription.planId !== plan.id) {
    throw new AppError(
      "Subscription plan does not match checkout plan",
      400
    );
  }

  if (!subscription) {
    subscription = await Subscription.create({
      apartment: apartmentId,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      durationValue: plan.durationValue,
      durationUnit: plan.durationUnit,
      status: "pending",
      paymentStatus: "pending",
    });
  }

  const taxBreakdown =
    calculateInclusiveGST(plan.price);

  const existingPayment = await Payment.findOne({
    paymentType: "SUBSCRIPTION",
    referenceId: subscription._id,
    status: "PENDING",
  });

  if (existingPayment?.razorpayOrderId) {
    return {
      key: razorpayPublicKey,

      paymentId: existingPayment._id,

      subscriptionId: subscription._id,

      apartmentId,

      orderId: existingPayment.razorpayOrderId,

      amount: Math.round(existingPayment.amount * 100),

      currency: existingPayment.currency,

      plan: {
        id: plan.id,
        name: plan.name,
        amount: plan.price,
      },

      pricing: taxBreakdown,
    };
  }

  const razorpayOrder =
    await razorpay.orders.create({
      amount: Math.round(plan.price * 100),

      currency: "INR",

      receipt: `sub_${subscription._id.toString()}`,

      notes: {
        apartmentId,
        subscriptionId:
          subscription._id.toString(),
        planId,
        planName: plan.name,
      },
    });

  subscription.razorpayOrderId =
    razorpayOrder.id;

  await subscription.save();

  const payment = await Payment.create(
    buildPaymentPayload({
      apartmentId,
      userId,
      referenceId: subscription._id.toString(),
      paymentType: "SUBSCRIPTION",
      taxBreakdown,
      razorpayOrderId: razorpayOrder.id,
    })
  );

  return {
    key: razorpayPublicKey,

    paymentId: payment._id,

    subscriptionId: subscription._id,

    apartmentId,

    orderId:
      razorpayOrder.id,

    amount:
      razorpayOrder.amount,

    currency:
      razorpayOrder.currency,

    plan: {
      id: planId,
      name: plan.name,
      amount: plan.price,
    },

    pricing: taxBreakdown,
  };
};

export const verifyCheckoutPaymentService =
  async ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: VerifyCheckoutInput) => {
    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      throw new AppError(
        "Missing Razorpay payment details",
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

    if (payment.status === "CAPTURED") {
      if (
        payment.razorpayPaymentId &&
        payment.razorpayPaymentId !==
          razorpayPaymentId
      ) {
        throw new AppError(
          "Payment has already been captured with a different Razorpay payment id",
          400
        );
      }

      return {
        verified: true,

        paymentId: payment._id,

        paymentStatus: payment.status,

        razorpayOrderId,

        razorpayPaymentId:
          payment.razorpayPaymentId ||
          razorpayPaymentId,

        amount: Math.round(payment.amount * 100),

        currency: payment.currency,

        subscriptionId:
          payment.paymentType ===
          "SUBSCRIPTION"
            ? payment.referenceId
            : undefined,
      };
    }

    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpayOrderId
      );

    if (!razorpayOrder) {
      throw new AppError(
        "Razorpay order not found",
        404
      );
    }

    const signatureBody =
      `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayKeySecret
        )
        .update(signatureBody)
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature,
        "utf8"
      );

    const isValid =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!isValid) {
      if (payment.status === "PENDING") {
        payment.status = "FAILED";
        await payment.save();
      }

      throw new AppError(
        "Payment signature verification failed",
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

    let subscriptionStatus:
      | string
      | undefined;

    if (payment.paymentType === "SUBSCRIPTION") {
      const subscription =
        await Subscription.findById(
          payment.referenceId
        );

      if (subscription) {
        const startDate =
          subscription.startDate ||
          new Date();

        subscription.razorpayOrderId =
          razorpayOrderId;
        subscription.razorpayPaymentId =
          razorpayPaymentId;
        subscription.razorpaySignature =
          razorpaySignature;
        subscription.paymentStatus = "paid";
        subscription.status = "active";
        subscription.startDate = startDate;
        subscription.endDate =
          subscription.endDate ||
          calculateSubscriptionEndDate(
            startDate,
            subscription.durationValue,
            subscription.durationUnit
          );
        subscription.paidAt =
          subscription.paidAt || new Date();

        await subscription.save();

        subscriptionStatus = subscription.status;
      }
    }

    await Apartment.findByIdAndUpdate(
      payment.apartmentId,
      {
        status: "active",
      },
      {
        runValidators: true,
      }
    );

    return {
      verified: true,

      paymentId: payment._id,

      paymentStatus: payment.status,

      razorpayOrderId,

      razorpayPaymentId,

      amount:
        razorpayOrder.amount,

      currency:
        razorpayOrder.currency,

      subscriptionId:
        payment.paymentType ===
        "SUBSCRIPTION"
          ? payment.referenceId
          : undefined,

      subscriptionStatus,
    };
  };
