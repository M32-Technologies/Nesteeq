import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createPaymentOrderSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    apartmentId: objectIdSchema,
    referenceId: objectIdSchema,

    paymentType: z.enum([
      "SUBSCRIPTION",
      "MAINTENANCE",
      "RENT",
    ]),

    totalAmount: z
      .number()
      .positive("Total amount must be greater than zero"),
  }),
});

export const createCheckoutOrderSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,

    planId: z.enum([
      "MONTHLY",
      "HALF_YEARLY",
      "YEARLY",
    ]),

    subscriptionId: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
  }),
});

export const verifyCheckoutPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z
      .string()
      .min(1, "Razorpay order id is required"),

    razorpayPaymentId: z
      .string()
      .min(1, "Razorpay payment id is required"),

    razorpaySignature: z
      .string()
      .min(1, "Razorpay signature is required"),
  }),
});

export type CreatePaymentOrderInput = z.infer<
  typeof createPaymentOrderSchema
>["body"];

export type CreateCheckoutOrderInput = z.infer<
  typeof createCheckoutOrderSchema
>["body"];

export type VerifyCheckoutPaymentInput = z.infer<
  typeof verifyCheckoutPaymentSchema
>["body"];
