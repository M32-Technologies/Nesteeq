import { catchAsync } from "../../utils/catchAsync.js";
import { Request , Response } from "express";
import { CreateSubscriptionPlan, GetSubscriptionPlans } from "./subscription.service.js";

export const CreateSubscriptionPlanHandler = catchAsync(
    async (req : Request , res : Response)=>{
        
        const result = await CreateSubscriptionPlan(req.body)
        res.status(201).json({
            success: true,
            message: "Subscription plan created successfully",
            data: result,
        })
    }
)

export const GetSubscriptionPlansHandler = catchAsync(
    async (req: Request, res: Response) => {
        const result = await GetSubscriptionPlans()

        res.status(200).json({
            success: true,
            data: result,
        })
    }
)
