import { z } from "zod";
const phoneRegex = /^\+?[1-9]\d{7,14}$/;
const normalizePhone = (value: string) => value.replace(/[\s()-]/g, "");

export const registerSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name is too long")
        .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters"),

    email: z
        .email("Enter a valid email address")
        .trim()
        .min(1, "Email is required")
        .toLowerCase(),

    phone: z
        .string()
        .trim()
        .min(1, "Phone number is required")
        .transform(normalizePhone)
        .refine(
            (value) => phoneRegex.test(value),
            "Enter a valid phone number with country code",
        ),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
