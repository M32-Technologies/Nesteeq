import { Types } from "mongoose"
import { z } from "zod"

const objectIdSchema = (fieldName: string) =>
  z.string()
    .trim()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: `${fieldName} must be a valid id`,
    });

export const generateParkingSlotsSchema = z.object({
  body: z.object({
    level: z
      .string()
      .trim()
      .min(1, "Level is required")
      .max(100, "Level is too long"),

    zoneName: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;

        const trimmed = value.trim();

        return trimmed === "" ? null : trimmed;
      },
      z
        .string()
        .max(100, "Zone name is too long")
        .nullable()
        .optional()
    ),

    usageType: z.preprocess(
      (value) =>
        typeof value === "string" ? value.trim().toUpperCase() : value,
      z.enum(["RESIDENT", "VISITOR"])
    ),

    vehicleType: z.preprocess(
      (value) =>
        typeof value === "string" ? value.trim().toUpperCase() : value,
      z.enum(["CAR", "BIKE", "EV", "OTHER"])
    ),

    numberOfSlots: z.coerce
      .number()
      .int("Number of slots must be a whole number")
      .positive("Number of slots must be greater than 0")
      .max(1000, "You can generate a maximum of 1000 slots at once"),
  }).strict(),
});

export type GenerateParkingSlotsInput = z.infer<typeof generateParkingSlotsSchema>["body"];

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const getParkingSlotsQuerySchema = z.object({
  query: z.object({
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().optional()
    ),

    vehicleType: z.preprocess(
      emptyToUndefined,
      z.enum(["CAR", "BIKE", "EV", "OTHER"]).optional()
    ),

    usageType: z.preprocess(
      emptyToUndefined,
      z.enum(["RESIDENT", "VISITOR"]).optional()
    ),

    status: z.preprocess(
      emptyToUndefined,
      z.enum([
        "AVAILABLE",
        "ASSIGNED",
        "OCCUPIED",
        "INACTIVE",
      ]).optional()
    ),

    level: z.preprocess(
      emptyToUndefined,
      z.string().trim().optional()
    ),

    zoneCode: z.preprocess(
      emptyToUndefined,
      z.string().trim().toUpperCase().optional()
    ),

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
});

export type GetParkingSlotsQuery = z.infer<typeof getParkingSlotsQuerySchema>["query"];

export const parkingIdParamsSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
});

export type ParkingIdParams = z.infer<typeof parkingIdParamsSchema>["params"];

export const updateParkingSlotBodySchema = z
  .object({
    level: z
      .string()
      .trim()
      .min(1, "Level is required")
      .max(100, "Level cannot exceed 100 characters")
      .optional(),

    zoneName: z
      .string()
      .trim()
      .max(100, "Zone name cannot exceed 100 characters")
      .nullable()
      .optional(),

    vehicleType: z
      .enum(["CAR", "BIKE", "EV", "OTHER"])
      .optional(),

    usageType: z
      .enum(["RESIDENT", "VISITOR"])
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.level !== undefined ||
      data.zoneName !== undefined ||
      data.vehicleType !== undefined ||
      data.usageType !== undefined,
    {
      message: "At least one field is required",
    }
  );

export const updateParkingSlotSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
  body: updateParkingSlotBodySchema,
});

export type UpdateParkingSlotInput = z.infer<typeof updateParkingSlotBodySchema>;

export const assignResidentParkingSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
  body: z
    .object({
      flatId: objectIdSchema("Flat id"),
      residentId: objectIdSchema("Resident id").optional(),
      vehicleNumber: z
        .string()
        .trim()
        .min(1, "Vehicle number is required")
        .max(20, "Vehicle number cannot exceed 20 characters"),
    })
    .strict(),
});

export type AssignResidentParkingInput = z.infer<
  typeof assignResidentParkingSchema
>["body"];

export const releaseParkingSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
});

export type ReleaseParkingParams = z.infer<typeof releaseParkingSchema>["params"];

export const updateParkingSlotStatusSchema = z.object({
  params: z.object({
    parkingId: objectIdSchema("Parking id"),
  }),
  body: z
    .object({
      status: z.enum(["AVAILABLE", "INACTIVE"], {
        message: "Status must be either AVAILABLE or INACTIVE",
      }),
    })
    .strict(),
});

export type UpdateParkingSlotStatusInput = z.infer<
  typeof updateParkingSlotStatusSchema
>["body"];

