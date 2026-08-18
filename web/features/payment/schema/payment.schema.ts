import { z } from "zod";

export const storedSelectedPlanSchema = z
  .object({
    id: z.unknown().optional(),
    planId: z.unknown().optional(),
    name: z.unknown().optional(),
    duration: z.unknown().optional(),
    amount: z.unknown().optional(),
  })
  .passthrough();
