import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createWalletSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema.optional(),
    residentId: objectIdSchema,
  }),
});

export const getWalletsSchema = z.object({
  query: z
    .object({
      apartmentId: objectIdSchema.optional(),
      status: z.enum(["ALL", "ACTIVE", "ZERO"]).optional(),
      search: z.string().trim().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    })
    .optional(),
});

export const getWalletSchema = z.object({
  params: z.object({
    residentId: objectIdSchema,
  }),

  query: z
    .object({
      apartmentId: objectIdSchema.optional(),
    })
    .optional(),
});

export const addWalletFundsSchema = z.object({
  params: z.object({
    residentId: objectIdSchema,
  }),

  body: z.object({
    apartmentId: objectIdSchema.optional(),

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
    apartmentId: objectIdSchema.optional(),

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
