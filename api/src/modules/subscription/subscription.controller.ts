import { Request, Response } from "express";

import {
  createSubscriptionService,
  verifySubscriptionPaymentService,
  getApartmentSubscriptionService,
} from "./subscription.service.js";

import { catchAsync } from "../../utils/catchAsync.js";

export const createSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, planId } = req.body;

    const result = await createSubscriptionService({
      apartmentId,
      planId,
    });

    res.status(201).json({
      success: true,
      message: result.requiresPayment
        ? "Subscription order created successfully"
        : "Free trial activated successfully",
      data: result,
    });
  }
);

export const verifySubscriptionPayment = catchAsync(
  async (req: Request, res: Response) => {
    const {
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const subscription =
      await verifySubscriptionPaymentService({
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      data: subscription,
    });
  }
);

export const getApartmentSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;

    const subscription =
      await getApartmentSubscriptionService(apartmentId);

    res.status(200).json({
      success: true,
      message: "Subscription fetched successfully",
      data: subscription,
    });
  }
);