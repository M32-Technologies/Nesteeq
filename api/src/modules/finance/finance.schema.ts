import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const getFinanceSummarySchema = z.object({
  params: z.object({
    apartmentId: objectIdSchema,
  }),
});

export const getMonthlyFinanceSchema = z.object({
  params: z.object({
    apartmentId: objectIdSchema,
  }),

  query: z.object({
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2000).optional(),
  }),
});