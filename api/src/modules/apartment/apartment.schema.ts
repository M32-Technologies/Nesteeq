import { z } from "zod";

const flatSchema = z.object({
  flatNumber: z
    .string()
    .trim()
    .min(1, "Flat number is required"),

  floor: z.coerce
    .number()
    .int()
    .min(0, "Floor cannot be negative"),
});

const blockOnlySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Block name is required"),

    floors: z.coerce
      .number()
      .int()
      .min(1, "At least one floor is required"),
  })
  .strict();

const blockWithFlatsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Block name is required"),

  floors: z.coerce
    .number()
    .int()
    .min(1, "At least one floor is required"),

  flats: z
    .array(flatSchema)
    .min(1, "At least one flat is required"),
});

export const createApartmentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required"),

    state: z
      .string()
      .trim()
      .min(2, "State is required"),

    city: z
      .string()
      .trim()
      .min(2, "City is required"),

    address: z
      .string()
      .trim()
      .min(3, "Address is required"),

    totalUnits: z.coerce
      .number()
      .int()
      .min(1, "Total units must be at least 1"),

    totalFloors: z.coerce
      .number()
      .int()
      .min(1, "Total floors must be at least 1"),

    totalBlocks: z.coerce
      .number()
      .int()
      .min(1, "Total blocks must be at least 1"),

    parkingSlots: z.coerce
      .number()
      .int()
      .min(0, "Parking slots cannot be negative"),

    contactNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Enter a valid 10 digit contact number"),

    emergencyNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Enter a valid 10 digit emergency number"),

    setupRequestId: z
      .string()
      .trim()
      .min(8, "Setup request id is invalid")
      .optional(),
  }),
});

export const updateBlocksSchema = z.object({
  body: z.object({
    blocks: z
      .array(blockOnlySchema)
      .min(1, "At least one block is required"),
  }),
});

export const updateFlatsSchema = z.object({
  body: z.object({
    blocks: z
      .array(blockWithFlatsSchema)
      .min(1, "At least one block is required"),
  }),
});
