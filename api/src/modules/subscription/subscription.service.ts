import { AppError } from "../../utils/AppError.js"
import { SubscriptionPlan } from "./subscription-plan.model.js"
import { SubscriptionPlanInput } from "./subscription.schema.js"


export const CreateSubscriptionPlan = async (data: SubscriptionPlanInput) => {
    const existingPlan = await SubscriptionPlan.findOne({
        planType: data.planType,
    })

    if (existingPlan) {
        throw new AppError("Subscription plan already exists for this plan type", 409)
    }

    return SubscriptionPlan.create(data)
}

export const GetSubscriptionPlans = async () => {
    return SubscriptionPlan.find({ isActive: true }).sort({ durationMonths: 1, price: 1 }).lean()
}
