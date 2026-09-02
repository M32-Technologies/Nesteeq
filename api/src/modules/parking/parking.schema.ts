import { z } from "zod"

import { VisitorParkingSlotStatus } from "./parking.interface.js"

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")

const optionalString = (
  schema: z.ZodString
) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value

    const trimmedValue = value.trim()
    return trimmedValue === "" ? undefined : trimmedValue
  }, schema.optional())

export const createParkingSlotSchema = z.object({
  body: z.object({
    slotNumber: z
      .string()
      .trim()
      .min(1, "Slot number is required")
      .max(30),
    status: z
      .enum([
        VisitorParkingSlotStatus.AVAILABLE,
        VisitorParkingSlotStatus.RESERVED,
        VisitorParkingSlotStatus.OUT_OF_SERVICE,
      ])
      .optional(),
    notes: optionalString(z.string().max(300)),
  }),
})

export const listParkingSlotsSchema = z.object({
  query: z.object({
    status: z
      .enum([
        "ALL",
        ...Object.values(VisitorParkingSlotStatus),
      ])
      .optional(),
    search: z.string().trim().max(100).optional(),
  }),
})

export const parkingSlotIdParamsSchema = z.object({
  params: z.object({
    slotId: objectIdSchema,
  }),
})

export const updateParkingSlotStatusSchema =
  parkingSlotIdParamsSchema.extend({
    body: z.object({
      status: z.enum([
        VisitorParkingSlotStatus.AVAILABLE,
        VisitorParkingSlotStatus.RESERVED,
        VisitorParkingSlotStatus.OUT_OF_SERVICE,
      ]),
      notes: optionalString(z.string().max(300)),
    }),
  })

export const assignParkingSlotSchema = z.object({
  body: z.object({
    slotId: objectIdSchema,
    flatId: objectIdSchema,
    visitorVisitId: objectIdSchema.optional(),
    visitorName: z
      .string()
      .trim()
      .min(1, "Visitor name is required")
      .max(100),
    vehicleNumber: z
      .string()
      .trim()
      .min(1, "Vehicle number is required")
      .max(20),
    vehicleType: optionalString(z.string().max(50)),
    notes: optionalString(z.string().max(300)),
  }),
})
