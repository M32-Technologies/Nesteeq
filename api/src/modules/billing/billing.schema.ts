import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const billStatusSchema = z.enum([
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
]);

const additionalChargeSchema = z.object({
  title: z.string().trim().min(1, "Charge title is required"),

  amount: z
    .number()
    .nonnegative("Charge amount cannot be negative"),

  reason: z.string().trim().optional(),
});

export const createBillSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,

    residentId: objectIdSchema,

    unitId: objectIdSchema,

    baseAmount: z
      .number()
      .positive("Base amount must be greater than 0"),

    additionalCharges: z
      .array(additionalChargeSchema)
      .optional(),

    lateFeePerDay: z
      .number()
      .nonnegative("Late fee cannot be negative")
      .optional(),

    dueDate: z.coerce.date(),

    createdBy: objectIdSchema.optional(),
  }),
});

export const getBillsSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),

    residentId: objectIdSchema.optional(),

    unitId: objectIdSchema.optional(),

    status: billStatusSchema.optional(),
  }),
});

export const getBillByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getBillingSummarySchema = z.object({
  params: z.object({
    apartmentId: objectIdSchema,
  }),
});

export const updateBillSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z
    .object({
      baseAmount: z.number().positive().optional(),

      additionalCharges: z
        .array(additionalChargeSchema)
        .optional(),

      lateFeePerDay: z
        .number()
        .nonnegative()
        .optional(),

      dueDate: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const recordBillPaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    amount: z
      .number()
      .positive("Payment amount must be greater than 0"),
  }),
});

export const waiveLateFeeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    amount: z
      .number()
      .positive("Waiver amount must be greater than 0"),
  }),
});
