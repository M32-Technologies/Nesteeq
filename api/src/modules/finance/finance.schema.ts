import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const getFinanceSummarySchema = z.object({
  params: z
    .object({
      apartmentId: objectIdSchema.optional(),
    })
    .optional(),

  query: z
    .object({
      apartmentId: objectIdSchema.optional(),
    })
    .optional(),
});

export const getMonthlyFinanceSchema = z.object({
  params: z
    .object({
      apartmentId: objectIdSchema.optional(),
    })
    .optional(),

  query: z
    .object({
      apartmentId: objectIdSchema.optional(),
      month: z.coerce.number().min(1).max(12).optional(),
      year: z.coerce.number().min(2000).optional(),
    })
    .optional(),
});