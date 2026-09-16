import { z } from "zod"

export const progressUpdateBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required and cannot be empty"),
})

export const progressUpdateSchema = z.union([
  z.object({
    body: progressUpdateBodySchema,
  }),
  progressUpdateBodySchema,
])

export const costSubmissionBodySchema = z.object({
  amount: z.coerce
    .number()
    .min(0, "Amount must be a non-negative number"),
  description: z.string().trim().optional(),
})

export const costSubmissionSchema = z.union([
  z.object({
    body: costSubmissionBodySchema,
  }),
  costSubmissionBodySchema,
])

export const completeWorkBodySchema = z.object({
  workSummary: z
    .string()
    .trim()
    .min(1, "Work summary is required"),
  notes: z.string().trim().optional(),
})

export const completeWorkSchema = z.union([
  z.object({
    body: completeWorkBodySchema,
  }),
  completeWorkBodySchema,
])

export type ProgressUpdateInput = z.infer<typeof progressUpdateBodySchema>
export type CostSubmissionInput = z.infer<typeof costSubmissionBodySchema>
export type CompleteWorkInput = z.infer<typeof completeWorkBodySchema>

