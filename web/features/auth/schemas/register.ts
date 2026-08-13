import { z } from "zod";
const phoneRegex = /^\+?[1-9]\d{7,14}$/;

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
        .regex(phoneRegex, "Enter a valid phone number with country code"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password is too long") 
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[0-9]/, "Password must include a number")
        .regex(/[^a-zA-Z0-9]/, "Password must include a special character"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
