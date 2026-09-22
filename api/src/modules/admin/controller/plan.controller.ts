import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync.js";
import {
    getAllSubscriptionPlans,
    getSingleSubscriptionPlan,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    updateSubscriptionPlanStatus,
} from "../services/plan.service.js";
import type { GetAllPlansQuery } from "../validation/plan.validation.js";

export const getAllPlansHandler = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query as unknown as GetAllPlansQuery;
        const result = await getAllSubscriptionPlans(query);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const getSinglePlanHandler = catchAsync(
    async (req: Request, res: Response) => {
        const planId = req.params.id as string;
        const result = await getSingleSubscriptionPlan(planId);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const createPlanHandler = catchAsync(
    async (req: Request, res: Response) => {
        const result = await createSubscriptionPlan(req.body);

        res.status(201).json({
            success: true,
            message: "Subscription plan created successfully",
            data: result,
        });
    }
);

export const updatePlanHandler = catchAsync(
    async (req: Request, res: Response) => {
        const planId = req.params.id as string;
        const result = await updateSubscriptionPlan(planId, req.body);

        res.status(200).json({
            success: true,
            message: "Subscription plan updated successfully",
            data: result,
        });
    }
);

export const updatePlanStatusHandler = catchAsync(
    async (req: Request, res: Response) => {
        const planId = req.params.id as string;
        const result = await updateSubscriptionPlanStatus(planId, req.body.isActive);

        res.status(200).json({
            success: true,
            message: `Subscription plan ${req.body.isActive ? "activated" : "deactivated"} successfully`,
            data: result,
        });
    }
);
