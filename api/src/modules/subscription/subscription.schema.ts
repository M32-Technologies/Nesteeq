import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

export const createSubscriptionSchema = z.object({
  body: z.object({
    apartmentId: mongoIdSchema,

    planId: z.enum([
      "TRIAL",
      "MONTHLY",
      "HALF_YEARLY",
      "YEARLY",
    ]),
  }),
});

export const verifySubscriptionPaymentSchema = z.object({
  body: z.object({
    subscriptionId: mongoIdSchema,

    razorpayOrderId: z
      .string()
      .min(1, "Razorpay order ID is required"),

    razorpayPaymentId: z
      .string()
      .min(1, "Razorpay payment ID is required"),

    razorpaySignature: z
      .string()
      .min(1, "Razorpay signature is required"),
  }),
});

export const getApartmentSubscriptionSchema = z.object({
  params: z.object({
    apartmentId: mongoIdSchema,
  }),
});
