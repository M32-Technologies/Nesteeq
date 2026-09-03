import { z } from "zod";

export const subscriptionPlanBodySchema = z.object({
    planName: z
        .string()
        .trim()
        .min(1, "Plan name is required"),

    price: z
        .number()
        .min(0, "Price cannot be negative"),

    planType: z.enum(["MONTHLY", "SIX_MONTHS", "YEARLY"], {
        error: "Plan type is required"
    }),

    durationMonths: z
        .number()
        .int("Duration must be a whole number")
        .min(1, "Duration must be at least 1 month"),

    features: z
        .array(z.string().trim().min(1, "Feature cannot be empty"))
        .default([]),

    freeTrial: z
        .object({
            enabled: z.boolean().default(false),
            days: z
                .number()
                .int("Trial days must be a whole number")
                .min(0, "Trial days cannot be negative")
                .default(0),
        })
        .refine(
            (data) => !data.enabled || data.days > 0,
            {
                message: "Trial days must be greater than 0 when free trial is enabled",
                path: ["days"],
            }
        )
        .default({ enabled: false, days: 0 }),

    razorpayPlanId: z
        .string()
        .trim()
        .min(1, "Razorpay plan id is required"),

    isActive: z.boolean().default(true),
});

export const subscriptionPlanSchema = z.object({
    body: subscriptionPlanBodySchema,
});

export const createSubscriptionSchema = z.object({
    body: z.object({
        planId: z.string().trim().min(1, "Plan id is required"),
    }),
});

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanBodySchema>;
