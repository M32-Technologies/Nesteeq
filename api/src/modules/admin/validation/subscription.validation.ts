import { z } from "zod";

export const getAllSubscriptionsQueryObjectSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10),
    search: z
        .string()
        .trim()
        .optional(),
    status: z
        .enum([
            "created",
            "authenticated",
            "active",
            "pending",
            "halted",
            "cancelled",
            "completed",
            "expired",
        ])
        .optional(),
    plan: z
        .string()
        .trim()
        .optional(),
    startDate: z
        .string()
        .trim()
        .optional(),
    endDate: z
        .string()
        .trim()
        .optional(),
    sortBy: z
        .enum(["createdAt", "updatedAt", "currentStart", "currentEnd", "status"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getAllSubscriptionsQuerySchema = z.object({
    query: getAllSubscriptionsQueryObjectSchema,
});

export const subscriptionAnalyticsQueryObjectSchema = z.object({
    range: z.enum(["3m", "6m", "12m", "1y"]).default("6m"),
});

export const subscriptionAnalyticsQuerySchema = z.object({
    query: subscriptionAnalyticsQueryObjectSchema,
});

export type GetAllSubscriptionsQuery = z.infer<typeof getAllSubscriptionsQueryObjectSchema>;
export type GetAllSubscriptionsRequest = z.infer<typeof getAllSubscriptionsQuerySchema>;
export type SubscriptionAnalyticsQuery = z.infer<typeof subscriptionAnalyticsQueryObjectSchema>;
export type SubscriptionAnalyticsRequest = z.infer<typeof subscriptionAnalyticsQuerySchema>;
