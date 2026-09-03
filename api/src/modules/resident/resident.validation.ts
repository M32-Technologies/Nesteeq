import { z } from "zod"

export const residentListQueryObjectSchema = z.object({
    search: z.string().trim().optional(),
    residentType: z
        .enum(["owner","resident"])
        .optional(),

    blockId: z.string().trim().optional(),
    status: z
        .enum(["active", "pending", "inactive"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const residentListQuerySchema = z.object({
    query: residentListQueryObjectSchema,
})


export type ResidentListQuery = z.infer<typeof residentListQueryObjectSchema>
