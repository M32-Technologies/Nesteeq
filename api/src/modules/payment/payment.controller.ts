import { Request, Response } from "express";

import {
  createCheckoutOrderService,
  createPaymentOrderService,
  verifyCheckoutPaymentService,
} from "./payment.service.js";

import type { TestPlanId } from "./payment.service.js";

import { catchAsync } from "../../utils/catchAsync.js";

export const createPaymentOrder = catchAsync(
  async (req: Request, res: Response) => {
    const {
      userId,
      apartmentId,
      referenceId,
      paymentType,
      totalAmount,
    } = req.body;

    const result = await createPaymentOrderService({
      userId,
      apartmentId,
      referenceId,
      paymentType,
      totalAmount,
    });

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: result,
    });
  }
);

export const createCheckoutOrder = catchAsync(
  async (req: Request, res: Response) => {
    const {
      apartmentId,
      planId,
      subscriptionId,
      userId,
    } = req.body;

    const result = await createCheckoutOrderService(
      {
        apartmentId,
        planId: planId as TestPlanId,
        subscriptionId,
        userId,
      }
    );

    res.status(201).json({
      success: true,
      message: "Razorpay checkout order created successfully",
      data: result,
    });
  }
);

export const verifyCheckoutPayment = catchAsync(
  async (req: Request, res: Response) => {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const result = await verifyCheckoutPaymentService({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  }
);
