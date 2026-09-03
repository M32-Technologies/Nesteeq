import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
  CreateSubscription,
  CreateSubscriptionPlan,
  GetSubscriptionPlans,
  VerifySubscriptionPayment,
} from "./subscription.service.js";

export const CreateSubscriptionPlanHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreateSubscriptionPlan(req.body);

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: result,
    });
  },
);

export const GetSubscriptionPlansHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await GetSubscriptionPlans();

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const CreateSubscriptionHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { planId } = req.body;
    const apartmentId = req.user?.apartmentId;
    const userId = req.user?.id;

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400);
    }

    if (!userId) {
      throw new AppError("Authenticated user is required", 401);
    }

    const result = await CreateSubscription(planId, apartmentId, userId);

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: result,
    });
  },
);

export const VerifySubscriptionPaymentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      throw new AppError("Missing payment verification fields", 400);
    }

    const result = await VerifySubscriptionPayment(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    );

    res.status(200).json({
      success: true,
      message: "Payment verified",
      data: result,
    });
  },
);
