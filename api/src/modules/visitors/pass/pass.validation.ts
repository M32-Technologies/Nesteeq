import { z } from "zod"

import { GuestPassStatus } from "./pass.model.js"

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")

const optionalString = (
  schema: z.ZodString
) =>
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

export const createGuestPassSchema = z.object({
  body: z
    .object({
      flatId: objectIdSchema,

      visitorName: z
        .string()
        .trim()
        .min(1, "Visitor name is required")
        .max(
          100,
          "Visitor name cannot exceed 100 characters"
        ),

      visitorPhone: optionalString(
        z
          .string()
          .min(
            5,
            "Visitor phone must contain at least 5 characters"
          )
          .max(
            20,
            "Visitor phone cannot exceed 20 characters"
          )
          .regex(
            /^[0-9+\-\s()]+$/,
            "Invalid visitor phone"
          )
      ),

      purpose: optionalString(
        z
          .string()
          .max(
            200,
            "Purpose cannot exceed 200 characters"
          )
      ),

      vehicleNumber: optionalString(
        z
          .string()
          .max(
            20,
            "Vehicle number cannot exceed 20 characters"
          )
      ),

      validFrom: z.coerce.date(),

      validUntil: z.coerce.date(),
    })
    .refine(
      (data) => data.validUntil > data.validFrom,
      {
        path: ["validUntil"],
        message:
          "validUntil must be later than validFrom",
      }
    )
    .refine(
      (data) => data.validUntil > new Date(),
      {
        path: ["validUntil"],
        message:
          "validUntil must be in the future",
      }
    ),
})

export const guestPassIdParamsSchema = z.object({
  params: z.object({
    guestPassId: objectIdSchema,
  }),
})

export const listGuestPassQuerySchema = z.object({
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

    status: z
      .nativeEnum(GuestPassStatus)
      .optional(),
  }),
})
