import { z } from "zod";

import { AuditAction } from "./audit.interface.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const getAuditLogsSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),
    performedBy: objectIdSchema.optional(),
    action: z.nativeEnum(AuditAction).optional(),
    entityType: z.string().trim().optional(),
    entityId: objectIdSchema.optional(),
  }),
});

export const getAuditByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});