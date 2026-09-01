import { z } from "zod";

const optionalPhone = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        (value.length >= 10 && value.length <= 15),
      `Enter a valid ${label}`,
    )
    .transform((value) => value || undefined)
    .optional();

export const createApartmentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Apartment name must be at least 2 characters"),

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
    .min(5, "Address is required"),

  totalUnits: z
    .string()
    .trim()
    .min(1, "Total units is required"),

  totalBlocks: z
    .string()
    .trim()
    .min(1, "Total blocks is required"),

  parkingSlots: z
    .string()
    .trim()
    .min(1, "Parking slots is required"),

  contactNumber: z
    .string()
    .trim()
    .min(10, "Enter a valid contact number")
    .max(15, "Enter a valid contact number"),

  emergencyContact: optionalPhone("emergency contact number"),
});

export const createApartmentSchema = z.object({
  body: createApartmentBodySchema,
});

export type CreateApartmentInput = z.infer<
  typeof createApartmentBodySchema
>;
