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
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});