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

export const billTypeEnum = z.enum([
  "MONTHLY_MAINTENANCE",
  "WATER",
  "COMMON_ELECTRICITY",
  "LIFT_MAINTENANCE",
  "SPECIAL_REPAIR",
  "PARKING_MAINTENANCE",
  "OTHER",
]);

export const createBillSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,

    residentId: objectIdSchema.optional(),

    unitId: objectIdSchema,

    title: z.string().trim().min(1).optional(),

    billType: billTypeEnum.optional(),

    billingPeriod: z
      .string()
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format")
      .optional()
      .nullable(),

    description: z.string().trim().max(500).optional().nullable(),

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
  }),
});

export const createCommonBillSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,
    title: z.string().trim().min(2, "Bill title must be at least 2 characters"),
    billType: billTypeEnum,
    billingPeriod: z
      .string()
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format")
      .optional()
      .nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    baseAmount: z.coerce.number().positive("Base amount must be greater than 0"),
    additionalCharges: z.array(additionalChargeSchema).optional().default([]),
    lateFeePerDay: z.coerce.number().nonnegative("Late fee cannot be negative").optional().default(0),
    dueDate: z.coerce.date(),
    targetType: z.enum(["ALL_FLATS", "BY_BLOCK", "CUSTOM_FLATS"]).default("ALL_FLATS"),
    targetBlockIds: z.array(objectIdSchema).optional().default([]),
    targetFlatIds: z.array(objectIdSchema).optional().default([]),
  }),
});

export const getBillsSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),

    residentId: objectIdSchema.optional(),

    unitId: objectIdSchema.optional(),

    commonBillId: objectIdSchema.optional(),

    billType: billTypeEnum.optional(),

    status: billStatusSchema.optional(),
  }),
});

export const getCommonBillsSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),
    billType: billTypeEnum.optional(),
    status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
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
    paymentMethod: z.string().trim().optional(),
    referenceNo: z.string().trim().optional(),
    description: z.string().trim().optional(),
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

export const payResidentBillSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
    paymentMethod: z.string().trim().max(50).optional(),
    referenceNo: z.string().trim().max(100).optional(),
    description: z.string().trim().max(255).optional(),
  }),
});

