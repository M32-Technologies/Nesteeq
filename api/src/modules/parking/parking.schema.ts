import { Types } from "mongoose"
import { z } from "zod"

const objectIdSchema = (fieldName: string) =>
  z.string()
    .trim()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: `${fieldName} must be a valid id`,
    })

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value

const enumText = (value: unknown) =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim().toUpperCase()
    : emptyToUndefined(value)

const optionalString = (schema: z.ZodString) =>
  z.preprocess(emptyToUndefined, schema.optional())

const visitorStatuses = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "UNAVAILABLE",
] as const

const parkingStatuses = [
  "AVAILABLE",
  "ASSIGNED",
  "OCCUPIED",
  "INACTIVE",
] as const

const vehicleTypes = ["CAR", "BIKE", "EV", "OTHER"] as const
const usageTypes = ["RESIDENT", "VISITOR"] as const

const indianVehicleNumberRegex =
  /^(?:[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}|\d{2}[\s-]?BH[\s-]?\d{4}[\s-]?[A-Z]{1,2})$/i

export const createParkingSlotSchema = z.object({
  body: z.object({
    slotNumber: z
      .string()
      .trim()
      .min(1, "Slot number is required")
      .max(30),
    notes: optionalString(z.string().max(300)),
  }),
})

export const listParkingSlotsSchema = z.object({
  query: z.object({
    status: z.preprocess(
      emptyToUndefined,
      z
        .enum([
          "ALL",
          "AVAILABLE",
          "OCCUPIED",
          "RESERVED",
          "UNAVAILABLE",
          "ASSIGNED",
          "INACTIVE",
        ])
        .optional()
    ),
    search: optionalString(z.string().max(100)),
    vehicleType: z.preprocess(
      emptyToUndefined,
      z.enum(vehicleTypes).optional()
    ),
    usageType: z.preprocess(
      emptyToUndefined,
      z.enum(usageTypes).optional()
    ),
    level: optionalString(z.string().max(100)),
    zoneCode: optionalString(z.string().max(100).toUpperCase()),
    page: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1).optional()
      )
      .default(1),
    limit: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1).max(100).optional()
      )
      .default(10),
    sortBy: z
      .preprocess(
        emptyToUndefined,
        z.enum(["createdAt", "slotNumber"]).optional()
      )
      .default("slotNumber"),
    sortOrder: z
      .preprocess(
        emptyToUndefined,
        z.enum(["asc", "desc"]).optional()
      )
      .default("asc"),
  }),
})

export type GetParkingSlotsQuery = z.infer<
  typeof listParkingSlotsSchema
>["query"]

export type ListParkingSlotsQuery = GetParkingSlotsQuery

export const parkingIdParamsSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
})

export const parkingSlotIdParamsSchema = parkingIdParamsSchema

export type ParkingIdParams = z.infer<
  typeof parkingIdParamsSchema
>["params"]

export const updateParkingSlotStatusSchema =
  parkingIdParamsSchema.extend({
    body: z.object({
      status: z.enum([
        "AVAILABLE",
        "RESERVED",
        "UNAVAILABLE",
        "INACTIVE",
      ]),
      notes: optionalString(z.string().max(300)),
    }),
  })

export type UpdateParkingSlotStatusInput = z.infer<
  typeof updateParkingSlotStatusSchema
>["body"]

export const assignParkingSlotSchema = z.object({
  body: z.object({
    slotId: objectIdSchema("Parking slot id"),
    flatId: objectIdSchema("Flat id"),
    visitorVisitId: objectIdSchema("Visitor visit id").optional(),
    visitorName: z
      .string()
      .trim()
      .min(1, "Visitor name is required")
      .max(100),
    vehicleNumber: z
      .string()
      .trim()
      .min(1, "Vehicle number is required")
      .max(20)
      .regex(indianVehicleNumberRegex, "Enter a valid vehicle number"),
    vehicleType: z.preprocess(
      enumText,
      z.enum(vehicleTypes)
    ),
    notes: optionalString(z.string().max(300)),
  }),
})

export const legacyGenerateParkingSlotsBodySchema = z
  .object({
    prefix: z
      .string()
      .trim()
      .min(1, "Prefix is required")
      .max(10, "Prefix must be 10 characters or less"),
    totalSlots: z.coerce
      .number()
      .int("totalSlots must be a whole number")
      .min(1, "totalSlots must be greater than 0")
      .max(500, "totalSlots cannot exceed 500"),
    startNumber: z.coerce
      .number()
      .int("startNumber must be a whole number")
      .min(1, "startNumber must be greater than 0")
      .optional()
      .default(1),
  })
  .strict()

export const managerGenerateParkingSlotsBodySchema = z
  .object({
    level: z
      .string()
      .trim()
      .min(1, "Level is required")
      .max(100, "Level is too long"),
    zoneName: z.preprocess(
      emptyToNull,
      z.string().max(100, "Zone name is too long").nullable().optional()
    ),
    usageType: z.preprocess(
      enumText,
      z.enum(usageTypes)
    ),
    vehicleType: z.preprocess(
      enumText,
      z.enum(vehicleTypes)
    ),
    numberOfSlots: z.coerce
      .number()
      .int("Number of slots must be a whole number")
      .positive("Number of slots must be greater than 0")
      .max(1000, "You can generate a maximum of 1000 slots at once"),
  })
  .strict()

export const generateParkingSlotsSchema = z.object({
  body: z.union([
    legacyGenerateParkingSlotsBodySchema,
    managerGenerateParkingSlotsBodySchema,
  ]),
})

export type GenerateParkingSlotsInput = z.infer<
  typeof legacyGenerateParkingSlotsBodySchema
>

export type ManagerGenerateParkingSlotsInput = z.infer<
  typeof managerGenerateParkingSlotsBodySchema
>

export const updateParkingSlotBodySchema = z
  .object({
    slotNumber: optionalString(z.string().min(1).max(30)),
    notes: z.preprocess(
      emptyToNull,
      z.string().trim().max(300).nullable().optional()
    ),
    level: optionalString(
      z.string().min(1, "Level is required").max(100)
    ),
    zoneName: z.preprocess(
      emptyToNull,
      z.string().trim().max(100).nullable().optional()
    ),
    vehicleType: z.preprocess(
      emptyToUndefined,
      z.enum(vehicleTypes).optional()
    ),
    usageType: z.preprocess(
      emptyToUndefined,
      z.enum(usageTypes).optional()
    ),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one parking slot field is required" }
  )

export const updateParkingSlotSchema =
  parkingIdParamsSchema.extend({
    body: updateParkingSlotBodySchema,
  })

export type UpdateParkingSlotInput = z.infer<
  typeof updateParkingSlotBodySchema
>

export const assignResidentParkingSchema =
  parkingIdParamsSchema.extend({
    body: z
      .object({
        flatId: objectIdSchema("Flat id"),
        residentId: objectIdSchema("Resident id").optional(),
        vehicleNumber: z
          .string()
          .trim()
          .max(20, "Vehicle number cannot exceed 20 characters")
          .optional()
          .nullable()
          .or(z.literal("")),
      })
      .strict(),
  })

export type AssignResidentParkingInput = z.infer<
  typeof assignResidentParkingSchema
>["body"]

export const releaseParkingSchema = parkingIdParamsSchema

export type ReleaseParkingParams = ParkingIdParams

export type VisitorParkingStatusUpdate = Exclude<
  (typeof visitorStatuses)[number],
  "OCCUPIED"
>

export type ManagerParkingStatusUpdate = Extract<
  (typeof parkingStatuses)[number],
  "AVAILABLE" | "INACTIVE"
>
