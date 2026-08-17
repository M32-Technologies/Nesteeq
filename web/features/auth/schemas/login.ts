import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
})

export type LoginFormValues = z.infer<typeof loginSchema>