import { z } from "zod";

import { PaymentSource } from "./payment.interface.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const getPaymentsSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),
    billId: objectIdSchema.optional(),
    residentId: objectIdSchema.optional(),
    source: z.nativeEnum(PaymentSource).optional(),
    paymentMethod: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    includeReversed: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
  }),
});

export const reversePaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(3, "Reversal reason must be at least 3 characters")
      .max(500, "Reversal reason too long"),
  }),
});