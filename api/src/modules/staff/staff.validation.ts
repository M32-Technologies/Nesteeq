import { z } from "zod"
import { STAFF_ROLES } from "./staff.model.js"

export const staffListQueryObjectSchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const staffListQuerySchema = z.object({
  query: staffListQueryObjectSchema,
})

export type StaffListQuery = z.infer<typeof staffListQueryObjectSchema>
