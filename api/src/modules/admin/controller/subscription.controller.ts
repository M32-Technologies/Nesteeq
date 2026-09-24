import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync.js";
import {
    getAllSubscriptions,
    getSubscriptionStats,
    getSubscriptionAnalytics,
    getSingleSubscription,
} from "../services/subscription.service.js";
import { GetAllSubscriptionsQuery, SubscriptionAnalyticsQuery } from "../validation/subscription.validation.js";

export const getAllSubscriptionsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query as unknown as GetAllSubscriptionsQuery;
        const result = await getAllSubscriptions(query);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const getSubscriptionStatsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const result = await getSubscriptionStats();

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const getSubscriptionAnalyticsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query as unknown as SubscriptionAnalyticsQuery;
        const result = await getSubscriptionAnalytics(query);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const getSingleSubscriptionHandler = catchAsync(
    async (req: Request, res: Response) => {
        const subscriptionId = req.params.id as string;
        const result = await getSingleSubscription(subscriptionId);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);
