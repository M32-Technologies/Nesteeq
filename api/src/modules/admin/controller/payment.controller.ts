import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync.js";
import {
  getAllSubscriptionPayments,
  getRevenueStats,
  getRevenueAnalytics,
} from "../services/payment.service.js";
import {
  GetAllPaymentsQuery,
  RevenueAnalyticsQuery,
} from "../validation/payment.validation.js";

export const getAllPaymentsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetAllPaymentsQuery;
    const result = await getAllSubscriptionPayments(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const getRevenueStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await getRevenueStats();

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const getRevenueAnalyticsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as RevenueAnalyticsQuery;
    const result = await getRevenueAnalytics(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);
