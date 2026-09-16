import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────

export const announcementTypeEnum = z.enum([
  "GENERAL",
  "MAINTENANCE",
  "EVENTS_SOCIAL",
  "EMERGENCY",
  "COMMUNITY_COUNCIL",
]);

export const announcementTargetTypeEnum = z.enum([
  "ALL_RESIDENTS",
  "BLOCK",
]);

export const announcementPriorityEnum = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

export const announcementStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

// ─── Helpers ─────────────────────────────────────────────

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// ─── Create Announcement ────────────────────────────────

export const createAnnouncementSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(150, "Title must not exceed 150 characters"),

      message: z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(2000, "Message must not exceed 2000 characters"),

      type: announcementTypeEnum,

      priority: announcementPriorityEnum.optional().default("NORMAL"),

      status: announcementStatusEnum.optional().default("PUBLISHED"),

      targetType: announcementTargetTypeEnum,

      targetIds: z
        .array(z.string().trim().min(1))
        .optional()
        .default([]),

      expiresAt: z
        .string()
        .datetime({ message: "Invalid date format" })
        .nullable()
        .optional()
        .refine(
          (val) => !val || new Date(val) > new Date(),
          { message: "Expiration date must be in the future" }
        ),
    })
    .strict()
    .superRefine((data, ctx) => {
      // If targeting a specific block, targetIds must not be empty
      if (data.targetType === "BLOCK" && (!data.targetIds || data.targetIds.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetIds"],
          message: "targetIds is required when targeting a specific block",
        });
      }

      // Emergency announcements must always be URGENT + PUBLISHED + ALL_RESIDENTS
      if (data.type === "EMERGENCY") {
        if (data.priority !== "URGENT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["priority"],
            message: "Emergency announcements must have URGENT priority",
          });
        }
        if (data.status !== "PUBLISHED") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["status"],
            message: "Emergency announcements must be PUBLISHED immediately",
          });
        }
        if (data.targetType !== "ALL_RESIDENTS") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetType"],
            message: "Emergency announcements must target ALL_RESIDENTS",
          });
        }
      }
    }),
});

// ─── Update Announcement ────────────────────────────────

export const updateAnnouncementSchema = z.object({
  params: z.object({
    announcementId: objectIdSchema,
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(150, "Title must not exceed 150 characters")
        .optional(),

      message: z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(2000, "Message must not exceed 2000 characters")
        .optional(),

      type: announcementTypeEnum.optional(),

      priority: announcementPriorityEnum.optional(),

      status: announcementStatusEnum.optional(),

      targetType: announcementTargetTypeEnum.optional(),

      targetIds: z
        .array(z.string().trim().min(1))
        .optional(),

      expiresAt: z
        .string()
        .datetime({ message: "Invalid date format" })
        .nullable()
        .optional()
        .refine(
          (val) => !val || new Date(val) > new Date(),
          { message: "Expiration date must be in the future" }
        ),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.targetType === "BLOCK" && data.targetIds && data.targetIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetIds"],
          message: "targetIds must not be empty when targeting a specific block",
        });
      }

      if (data.type === "EMERGENCY") {
        if (data.priority && data.priority !== "URGENT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["priority"],
            message: "Emergency announcements must have URGENT priority",
          });
        }
        if (data.status && data.status !== "PUBLISHED") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["status"],
            message: "Emergency announcements must be PUBLISHED immediately",
          });
        }
        if (data.targetType && data.targetType !== "ALL_RESIDENTS") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetType"],
            message: "Emergency announcements must target ALL_RESIDENTS",
          });
        }
      }
    }),
});

// ─── Update Status ──────────────────────────────────────

export const updateAnnouncementStatusSchema = z.object({
  params: z.object({
    announcementId: objectIdSchema,
  }),
  body: z.object({
    status: announcementStatusEnum,
  }),
});

// ─── List Announcements ─────────────────────────────────

export const listAnnouncementsSchema = z.object({
  query: z.object({
    type: announcementTypeEnum.optional(),
    status: announcementStatusEnum.optional(),
    targetType: announcementTargetTypeEnum.optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
  }),
});

// ─── Params ──────────────────────────────────────────────

export const announcementIdParamsSchema = z.object({
  params: z.object({
    announcementId: objectIdSchema,
  }),
});

// ─── Emergency Broadcast ───────────────────────────────

export const emergencyCategoryEnum = z.enum([
  "FIRE",
  "GAS_LEAK",
  "MEDICAL",
  "SECURITY",
  "WEATHER",
  "INFRASTRUCTURE",
  "WATER_CONTAMINATION",
  "OTHER",
]);

export const emergencyBroadcastSchema = z.object({
  body: z
    .object({
      category: emergencyCategoryEnum,
      title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must not exceed 150 characters"),
      message: z
        .string()
        .trim()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message must not exceed 2000 characters"),
      targetType: announcementTargetTypeEnum,
      targetIds: z.array(objectIdSchema).optional(),
      actionInstructions: z.string().trim().max(1000).optional(),
      contactPhone: z.string().trim().max(30).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.targetType === "BLOCK") {
        if (!data.targetIds || data.targetIds.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Target block IDs are required when targeting specific blocks",
            path: ["targetIds"],
          });
        }
      }
    }),
});

// ─── Types ───────────────────────────────────────────────

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>["body"];
export type UpdateAnnouncementBody = z.infer<typeof updateAnnouncementSchema>["body"];
export type UpdateAnnouncementStatusBody = z.infer<typeof updateAnnouncementStatusSchema>["body"];
export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsSchema>["query"];
export type AnnouncementIdParams = z.infer<typeof announcementIdParamsSchema>["params"];
export type EmergencyBroadcastBody = z.infer<typeof emergencyBroadcastSchema>["body"];
