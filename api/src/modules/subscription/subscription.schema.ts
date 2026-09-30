import { z } from "zod";

export const createSubscriptionSchema = z.object({
    body: z.object({
        planId: z.string().trim().min(1, "Plan id is required"),
    }),
});

