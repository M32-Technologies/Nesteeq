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
  type: z
    .string()
    .trim()
    .optional(),
  startDate: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    }, z.coerce.date().optional()),
  endDate: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    }, z.coerce.date().optional()),
  sortBy: z
    .enum(["paidAt", "amount", "createdAt"])
    .default("paidAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.startDate <= data.endDate;
  },
  {
    message: "startDate cannot be after endDate",
    path: ["startDate"],
  }
);

export const getAllPaymentsQuerySchema = z.object({
  query: getAllPaymentsQueryObjectSchema,
});

export const revenueAnalyticsQueryObjectSchema = z.object({
  range: z.enum(["3m", "6m", "12m", "1y"]).default("6m"),
});

export const revenueAnalyticsQuerySchema = z.object({
  query: revenueAnalyticsQueryObjectSchema,
});

export const topSocietiesQueryObjectSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export const topSocietiesQuerySchema = z.object({
  query: topSocietiesQueryObjectSchema,
});

export type GetAllPaymentsQuery = z.infer<typeof getAllPaymentsQueryObjectSchema>;
export type GetAllPaymentsRequest = z.infer<typeof getAllPaymentsQuerySchema>;
export type RevenueAnalyticsQuery = z.infer<typeof revenueAnalyticsQueryObjectSchema>;
export type RevenueAnalyticsRequest = z.infer<typeof revenueAnalyticsQuerySchema>;
export type TopSocietiesQuery = z.infer<typeof topSocietiesQueryObjectSchema>;
export type TopSocietiesRequest = z.infer<typeof topSocietiesQuerySchema>;
