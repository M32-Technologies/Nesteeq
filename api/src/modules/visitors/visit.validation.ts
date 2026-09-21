import { z } from "zod"

import { GuestPassStatus } from "./visit.model.js"

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")

const indianPhoneNumberRegex =
  /^(?:(?:\+91|91|0)[-\s]?)?[6-9](?:[\s-]?\d){9}$/

const indianVehicleNumberRegex =
  /^(?:[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}|\d{2}[\s-]?BH[\s-]?\d{4}[\s-]?[A-Z]{1,2})$/i

const vehicleTypes = ["CAR", "BIKE", "EV", "OTHER"] as const

const optionalVehicleType = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value
    const trimmedValue = value.trim()
    return trimmedValue ? trimmedValue.toUpperCase() : undefined
  },
  z.enum(vehicleTypes).optional()
)

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

export const createGuestPassSchema = z.object({
  body: z
    .object({
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
        z.string().max(200, "Purpose cannot exceed 200 characters")
      ),
      vehicleNumber: optionalString(
        z.string().max(20, "Vehicle number cannot exceed 20 characters")
      ),
      vehicleType: optionalVehicleType,
      validFrom: z.coerce.date(),
      validUntil: z.coerce.date(),
    })
    .refine((data) => data.validUntil > data.validFrom, {
      path: ["validUntil"],
      message: "validUntil must be later than validFrom",
    })
    .refine((data) => data.validUntil > new Date(), {
      path: ["validUntil"],
      message: "validUntil must be in the future",
    }),
})

export const guestPassIdParamsSchema = z.object({
  params: z.object({
    guestPassId: objectIdSchema,
  }),
})

export const listGuestPassQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.nativeEnum(GuestPassStatus).optional(),
  }),
})

export const checkInVisitorSchema = z.object({
  body: z
    .object({
      visitorPassId: objectIdSchema.optional(),
      token: z
        .string()
        .trim()
        .min(1, "Guest pass token is required")
        .optional(),
    })
    .refine((data) => Boolean(data.visitorPassId) !== Boolean(data.token), {
      message: "Provide either guest pass token or ID",
    }),
})

export const manualVisitorEntrySchema = z.object({
  body: z
    .object({
      flatId: objectIdSchema,

      visitorName: z
        .string()
        .trim()
        .min(1, "Visitor name is required")
        .max(100, "Visitor name cannot exceed 100 characters"),

      visitorPhone: optionalString(
        z
          .string()
          .max(20, "Visitor phone cannot exceed 20 characters")
          .regex(
            indianPhoneNumberRegex,
            "Enter a valid mobile number"
          )
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
          .regex(
            indianVehicleNumberRegex,
            "Enter a valid vehicle number"
          )
      ),

      vehicleType: optionalVehicleType,
      parkingSlotId: optionalString(objectIdSchema),
    })
    .refine((data) => !data.vehicleNumber || data.vehicleType, {
      path: ["vehicleType"],
      message: "Vehicle type is required when vehicle number is provided",
    })
    .refine((data) => !data.vehicleType || data.vehicleNumber, {
      path: ["vehicleNumber"],
      message: "Vehicle number is required when vehicle type is provided",
    })
    .refine((data) => !data.parkingSlotId || data.vehicleNumber, {
      path: ["vehicleNumber"],
      message: "Vehicle number is required when assigning a parking slot",
    })
    .refine((data) => !data.parkingSlotId || data.vehicleType, {
      path: ["vehicleType"],
      message: "Vehicle type is required when assigning a parking slot",
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
