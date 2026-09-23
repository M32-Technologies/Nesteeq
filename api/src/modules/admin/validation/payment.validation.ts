import { z } from "zod";

export const getAllPaymentsQueryObjectSchema = z.object({
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
    .enum(["captured", "failed", "refunded"])
    .optional(),
  sortBy: z
    .enum(["paidAt", "amount", "createdAt"])
    .default("paidAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getAllPaymentsQuerySchema = z.object({
  query: getAllPaymentsQueryObjectSchema,
});

export const revenueAnalyticsQueryObjectSchema = z.object({
  range: z.enum(["3m", "6m", "12m", "1y"]).default("6m"),
});

export const revenueAnalyticsQuerySchema = z.object({
  query: revenueAnalyticsQueryObjectSchema,
});

export type GetAllPaymentsQuery = z.infer<typeof getAllPaymentsQueryObjectSchema>;
export type GetAllPaymentsRequest = z.infer<typeof getAllPaymentsQuerySchema>;
export type RevenueAnalyticsQuery = z.infer<typeof revenueAnalyticsQueryObjectSchema>;
export type RevenueAnalyticsRequest = z.infer<typeof revenueAnalyticsQuerySchema>;
