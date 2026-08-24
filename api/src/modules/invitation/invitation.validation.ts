import { Types } from "mongoose"
import { z } from "zod"
import {
  INVITE_ROLES,
  INVITE_STATUSES,
  RESIDENT_INVITE_ROLES,
  STAFF_INVITE_ROLES,
} from "./invitation.types.js"


const objectIdSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: `${fieldName} must be a valid id`,
    })

const emailSchema = z.email("Invalid email address")
  .transform((value) => value.toLowerCase())

const tokenParamSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
})

const inviteIdParamSchema = z.object({
  id: objectIdSchema("Invitation id"),
})

const tokenBodySchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
})

export const createResidentInviteBodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: emailSchema,
  phoneNumber: z.string().trim().optional().nullable(),
  flatId: objectIdSchema("Flat id"),
  role: z.enum(RESIDENT_INVITE_ROLES),
})

export const createStaffInviteBodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: emailSchema,
  phoneNumber: z.string().trim().optional().nullable(),
  role: z.enum(STAFF_INVITE_ROLES),
})

export const getInvitationsQueryObjectSchema = z.object({
  status: z.enum(INVITE_STATUSES).optional(),
  role: z.enum(INVITE_ROLES).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})




export const bulkInviteRowSchema = z.object({
  rowNumber: z.number(),
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().trim().optional().nullable(),
  block: z.string().trim().min(1, "Block is required"),
  flatNumber: z.string().trim().min(1, "Flat number is required"),
  role: z.enum(RESIDENT_INVITE_ROLES, {message: "Role must be owner or tenant for bulk upload",}),
});

export type BulkInviteRow = z.infer<typeof bulkInviteRowSchema>;

export type BulkInviteRowResult = {
  row: number;
  email: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
};
export const createResidentInviteSchema = z.object({
  body: createResidentInviteBodySchema,
})

export const createStaffInviteSchema = z.object({
  body: createStaffInviteBodySchema,
})

export const getInvitationsSchema = z.object({
  query: getInvitationsQueryObjectSchema,
})

export const validateInvitationParamSchema = z.object({
  params: tokenParamSchema,
})

export const resolveInvitationQuerySchema = z.object({
  query: tokenParamSchema,
})

export const acceptInvitationParamSchema = z.object({
  params: tokenParamSchema,
})

export const acceptInvitationBodySchema = z.object({
  body: tokenBodySchema,
})

export const invitationIdParamSchema = z.object({
  params: inviteIdParamSchema,
})

export type CreateResidentInviteInput = z.infer<
  typeof createResidentInviteBodySchema
>
export type CreateStaffInviteInput = z.infer<
  typeof createStaffInviteBodySchema
>
export type GetInvitationsQuery = z.infer<
  typeof getInvitationsQueryObjectSchema
>
