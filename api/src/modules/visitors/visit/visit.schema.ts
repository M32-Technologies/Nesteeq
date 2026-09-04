import { z } from "zod"

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")

const optionalString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value
      }

      const trimmedValue = value.trim()

      return trimmedValue === ""
        ? undefined
        : trimmedValue
    },
    schema.optional()
  )

export const checkInVisitorSchema = z.object({
  body: z.object({
    visitorPassId: objectIdSchema,
  }),
})

export const manualVisitorEntrySchema = z.object({
  body: z.object({
    flatId: objectIdSchema,

    visitorName: z
      .string()
      .trim()
      .min(1, "Visitor name is required")
      .max(100, "Visitor name cannot exceed 100 characters"),

    visitorPhone: optionalString(
      z
        .string()
        .min(5, "Visitor phone must contain at least 5 characters")
        .max(20, "Visitor phone cannot exceed 20 characters")
        .regex(/^[0-9+\-\s()]+$/, "Invalid visitor phone")
    ),

    purpose: optionalString(
      z
        .string()
        .max(200, "Purpose cannot exceed 200 characters")
    ),

    vehicleNumber: optionalString(
      z
        .string()
        .max(20, "Vehicle number cannot exceed 20 characters")
    ),
  }),
})

export const visitorVisitIdParamsSchema = z.object({
  params: z.object({
    visitId: objectIdSchema,
  }),
})

export const listVisitorVisitsQuerySchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .optional(),
  }),
})

export const listVisitorRecordsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(["ALL", "UPCOMING", "ACTIVE", "EXITED"])
      .optional(),

    entryType: z
      .enum(["ALL", "PASS", "MANUAL"])
      .optional(),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    page: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .optional(),
  }),
})
