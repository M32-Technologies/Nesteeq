import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createWalletSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,
    residentId: objectIdSchema,
  }),
});

export const getWalletSchema = z.object({
  params: z.object({
    residentId: objectIdSchema,
  }),

  query: z.object({
    apartmentId: objectIdSchema,
  }),
});

export const addWalletFundsSchema = z.object({
  params: z.object({
    residentId: objectIdSchema,
  }),

  body: z.object({
    apartmentId: objectIdSchema,

    amount: z
      .number()
      .positive("Amount must be greater than 0"),

    description: z
      .string()
      .trim()
      .min(1, "Description is required"),
  }),
});

export const deductWalletFundsSchema = z.object({
  params: z.object({
    residentId: objectIdSchema,
  }),

  body: z.object({
    apartmentId: objectIdSchema,

    billId: objectIdSchema,

    amount: z
      .number()
      .positive("Amount must be greater than 0"),

    description: z
      .string()
      .trim()
      .min(1, "Description is required"),
  }),
});