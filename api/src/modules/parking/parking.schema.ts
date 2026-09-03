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
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
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

export const generateParkingSlotsBodySchema = z
  .object({
    prefix: z
      .string()
      .trim()
      .min(1, "Prefix is required")
      .max(10, "Prefix must be 10 characters or less"),
    totalSlots: z
      .number()
      .int("totalSlots must be a whole number")
      .min(1, "totalSlots must be greater than 0")
      .max(500, "totalSlots cannot exceed 500"),
    startNumber: z
      .number()
      .int("startNumber must be a whole number")
      .min(1, "startNumber must be greater than 0")
      .optional()
      .default(1),
  })
  .strict()

export const generateParkingSlotsSchema = z.object({
  body: generateParkingSlotsBodySchema,
})

export type GenerateParkingSlotsInput = z.infer<
  typeof generateParkingSlotsBodySchema
>

export const updateParkingSlotBodySchema = z
  .object({
    slotNumber: optionalString(
      z
        .string()
        .min(1, "Slot number cannot be empty")
        .max(30)
    ),
    notes: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.slotNumber !== undefined ||
      data.notes !== undefined,
    {
      message:
        "At least one field (slotNumber or notes) must be provided",
    }
  )

export const updateParkingSlotSchema =
  parkingSlotIdParamsSchema.extend({
    body: updateParkingSlotBodySchema,
  })

export type UpdateParkingSlotInput = z.infer<
  typeof updateParkingSlotBodySchema
>
