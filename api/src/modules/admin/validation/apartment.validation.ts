import { z } from "zod";
import { Types } from "mongoose";
export const getAllApartmentsQueryObjectSchema = z.object({
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
    .enum(["pending_payment", "active", "inactive"])
    .optional(),
  city: z
    .string()
    .trim()
    .optional(),
  state: z
    .string()
    .trim()
    .optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "city"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});


export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive"])
  })
})
export const getAllApartmentsQuerySchema = z.object({
  query: getAllApartmentsQueryObjectSchema,
});

export const apartmentAnalyticsQueryObjectSchema = z.object({
  range: z.enum(["3m", "6m", "12m", "1y"]).default("6m"),
});

export const apartmentAnalyticsQuerySchema = z.object({
  query: apartmentAnalyticsQueryObjectSchema,
});

export type GetAllApartmentsQuery = z.infer<typeof getAllApartmentsQueryObjectSchema>;
export type GetAllApartmentsRequest = z.infer<typeof getAllApartmentsQuerySchema>;
export type UpdateStatusSchema = z.infer<typeof updateStatusSchema>;
export type ApartmentAnalyticsQuery = z.infer<typeof apartmentAnalyticsQueryObjectSchema>;
export type ApartmentAnalyticsRequest = z.infer<typeof apartmentAnalyticsQuerySchema>;

