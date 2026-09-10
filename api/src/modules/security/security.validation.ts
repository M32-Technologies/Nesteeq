import { z } from "zod"

export const verifyGuestPassSchema = z.object({
  body: z.object({
    token: z
      .string()
      .trim()
      .min(1, "Guest pass token is required"),
  }),
})

export const listSecurityDirectorySchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .optional(),
  }),
})

export const securityActivityQuerySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(20)
      .optional(),
  }),
})
