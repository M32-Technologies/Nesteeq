import { Types } from "mongoose";
import { AppError } from "../../../utils/AppError.js";
import { SubscriptionPlan } from "../../subscription/subscription-plan.model.js";
import { razorpay } from "../../../config/razorpay.js";
import type { CreatePlanBody, UpdatePlanBody, GetAllPlansQuery } from "../validation/plan.validation.js";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const verifyRazorpayPlanId = async (razorpayPlanId: string) => {
    try {
        await razorpay.plans.fetch(razorpayPlanId);
    } catch (error: unknown) {
        const statusCode =
            error && typeof error === "object" && "statusCode" in error
                ? (error as { statusCode: number }).statusCode
                : undefined;

        if (statusCode === 400 || statusCode === 404) {
            throw new AppError(
                "Invalid Razorpay Plan ID. The plan does not exist in Razorpay.",
                400
            );
        }

        throw new AppError(
            "Unable to verify Razorpay Plan ID. Please check Razorpay service availability and try again.",
            502
        );
    }
};

export const getAllSubscriptionPlans = async (query: GetAllPlansQuery) => {
    const { page, limit, search, isActive, sortBy, sortOrder } = query;

    const match: Record<string, unknown> = {};

    if (typeof isActive === "boolean") {
        match.isActive = isActive;
    }

    if (search) {
        const escaped = escapeRegex(search);
        match.$or = [
            { planName: { $regex: escaped, $options: "i" } },
            { planType: { $regex: escaped, $options: "i" } },
        ];
    }

    const sortStage = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
        SubscriptionPlan.find(match)
            .sort(sortStage)
            .skip(skip)
            .limit(limit)
            .lean(),
        SubscriptionPlan.countDocuments(match),
    ]);

    return {
        plans,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getSingleSubscriptionPlan = async (planId: string) => {
    if (!planId || !Types.ObjectId.isValid(planId)) {
        throw new AppError("Invalid subscription plan id", 400);
    }

    const plan = await SubscriptionPlan.findById(planId).lean();

    if (!plan) {
        throw new AppError("Subscription plan not found", 404);
    }

    return plan;
};

export const createSubscriptionPlan = async (data: CreatePlanBody) => {
    const existing = await SubscriptionPlan.findOne({ planType: data.planType }).lean();
    if (existing) {
        throw new AppError("Subscription plan already exists for this plan type", 409);
    }

    await verifyRazorpayPlanId(data.razorpayPlanId);

    if (data.freeTrial && !data.freeTrial.enabled) {
        data.freeTrial.days = 0;
    }

    try {
        const plan = await SubscriptionPlan.create(data);
        return plan.toObject();
    } catch (error: unknown) {
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code: number }).code === 11000
        ) {
            throw new AppError("Subscription plan already exists for this plan type", 409);
        }
        throw error;
    }
};

export const updateSubscriptionPlan = async (planId: string, data: UpdatePlanBody) => {
    if (!planId || !Types.ObjectId.isValid(planId)) {
        throw new AppError("Invalid subscription plan id", 400);
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
        throw new AppError("Subscription plan not found", 404);
    }

    if (data.planType && data.planType !== plan.planType) {
        const existing = await SubscriptionPlan.findOne({
            planType: data.planType,
            _id: { $ne: planId },
        }).lean();
        if (existing) {
            throw new AppError("Subscription plan already exists for this plan type", 409);
        }
    }

    if (data.razorpayPlanId) {
        await verifyRazorpayPlanId(data.razorpayPlanId);
    }

    if (data.freeTrial && !data.freeTrial.enabled) {
        data.freeTrial.days = 0;
    }

    const updated = await SubscriptionPlan.findByIdAndUpdate(
        planId,
        { $set: data },
        { new: true, runValidators: true }
    ).lean();

    return updated;
};

export const updateSubscriptionPlanStatus = async (planId: string, isActive: boolean) => {
    if (!planId || !Types.ObjectId.isValid(planId)) {
        throw new AppError("Invalid subscription plan id", 400);
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
        throw new AppError("Subscription plan not found", 404);
    }

    if (plan.isActive === isActive) {
        throw new AppError(
            `Subscription plan is already ${isActive ? "active" : "inactive"}`,
            400
        );
    }

    plan.isActive = isActive;
    await plan.save();

    return plan.toObject();
};
