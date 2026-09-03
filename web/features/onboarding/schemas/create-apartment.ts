import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{7,14}$/;
const optionalPhoneText = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || phoneRegex.test(value),
      `Enter a valid ${label.toLowerCase()} with country code`,
    )
    .transform((value) => value || undefined);

const positiveIntegerText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .refine((value) => Number(value) > 0, `${label} must be greater than 0`);

export const createApartmentFormSchema = z.object({
  managerEmail: z
    .email("Enter a valid email address")
    .trim()
    .toLowerCase(),

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

  totalUnits: positiveIntegerText("Total units"),
  totalBlocks: positiveIntegerText("Total blocks"),

  parkingSlots: z
    .string()
    .trim()
    .min(1, "Parking slots is required")
    .regex(/^\d+$/, "Parking slots must be a whole number"),

  contactNumber: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid contact number with country code"),

  emergencyContact: z
    .union([
      optionalPhoneText("emergency contact number"),
      z.undefined(),
    ]),
});

export type CreateApartmentFormValues = z.infer<
  typeof createApartmentFormSchema
>;

export type CreateApartmentInput = Omit<
  CreateApartmentFormValues,
  "managerEmail"
>;

export const createApartmentFields = {
  account: ["managerEmail", "name"] as const,
  location: ["state", "city", "address"] as const,
  structure: [
    "totalUnits",
    "totalBlocks",
    "parkingSlots",
  ] as const,
  contacts: ["contactNumber", "emergencyContact"] as const,
};
