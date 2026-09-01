import { z } from "zod";
import {
  complaintCategories,
  complaintPriorities,
  complaintStatuses,
} from "./complaint.model.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid complaint ID");

const authUserIdSchema = z
  .string()
  .trim()
  .min(1, "User ID is required");

const nonEmptyText = (fieldName: string, maxLength: number) =>
  z.string().trim().min(1, `${fieldName} is required`).max(maxLength, `${fieldName} is too long`);

const costSchema = z.number().min(0, "Cost cannot be negative");

const requireAtLeastOneField = (data: Record<string, unknown>) => Object.keys(data).length > 0;

export const complaintIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const createComplaintBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(3000, "Description cannot exceed 3000 characters"),
    category: z.enum(complaintCategories, {
      error: "Complaint category is required",
    }),
    priority: z.enum(complaintPriorities, {
      error: "Complaint priority is required",
    }),
  })
  .strict();

export const updateComplaintBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(3000, "Description cannot exceed 3000 characters")
      .optional(),
    category: z.enum(complaintCategories).optional(),
    priority: z.enum(complaintPriorities).optional(),
    estimatedCost: costSchema.optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, {
    message: "At least one field is required",
  });

export const assignComplaintBodySchema = z
  .object({
    assignedStaff: authUserIdSchema,
    estimatedCost: costSchema.optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const updateComplaintStatusBodySchema = z
  .object({
    status: z.enum(complaintStatuses, {
      error: "Complaint status is required",
    }),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const completeComplaintWorkBodySchema = z
  .object({
    completionDetails: z
      .string()
      .trim()
      .min(10, "Completion details must be at least 10 characters")
      .max(3000, "Completion details cannot exceed 3000 characters"),
    finalCost: costSchema.optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const approveComplaintBodySchema = z
  .object({
    remarks: nonEmptyText("Approval remarks", 1000).optional(),
  })
  .strict();

export const rejectComplaintBodySchema = z
  .object({
    reason: nonEmptyText("Rejection reason", 1000),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const cancelComplaintBodySchema = z
  .object({
    reason: nonEmptyText("Cancellation reason", 1000).optional(),
  })
  .strict();

export const confirmComplaintResolutionBodySchema = z
  .object({
    remarks: nonEmptyText("Confirmation remarks", 1000).optional(),
  })
  .strict();

export const getComplaintsQuerySchema = z
  .object({
    status: z.enum(complaintStatuses).optional(),
    category: z.enum(complaintCategories).optional(),
    priority: z.enum(complaintPriorities).optional(),
    apartment: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    flat: z.string().trim().min(1, "Flat ID cannot be empty").optional(),
    resident: authUserIdSchema.optional(),
    assignedStaff: authUserIdSchema.optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const createComplaintSchema = z.object({
  body: createComplaintBodySchema,
});

export const getComplaintsSchema = z.object({
  query: getComplaintsQuerySchema,
});

export const getComplaintByIdSchema = z.object({
  params: complaintIdParamsSchema,
});

export const updateComplaintSchema = z.object({
  params: complaintIdParamsSchema,
  body: updateComplaintBodySchema,
});

export const assignComplaintSchema = z.object({
  params: complaintIdParamsSchema,
  body: assignComplaintBodySchema,
});

export const updateComplaintStatusSchema = z.object({
  params: complaintIdParamsSchema,
  body: updateComplaintStatusBodySchema,
});

export const completeComplaintWorkSchema = z.object({
  params: complaintIdParamsSchema,
  body: completeComplaintWorkBodySchema,
});

export const approveComplaintSchema = z.object({
  params: complaintIdParamsSchema,
  body: approveComplaintBodySchema,
});

export const rejectComplaintSchema = z.object({
  params: complaintIdParamsSchema,
  body: rejectComplaintBodySchema,
});

export const cancelComplaintSchema = z.object({
  params: complaintIdParamsSchema,
  body: cancelComplaintBodySchema,
});

export const confirmComplaintResolutionSchema = z.object({
  params: complaintIdParamsSchema,
  body: confirmComplaintResolutionBodySchema,
});

export type ComplaintIdParams = z.infer<typeof complaintIdParamsSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintBodySchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintBodySchema>;
export type AssignComplaintInput = z.infer<typeof assignComplaintBodySchema>;
export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusBodySchema>;
export type CompleteComplaintWorkInput = z.infer<typeof completeComplaintWorkBodySchema>;
export type ApproveComplaintInput = z.infer<typeof approveComplaintBodySchema>;
export type RejectComplaintInput = z.infer<typeof rejectComplaintBodySchema>;
export type CancelComplaintInput = z.infer<typeof cancelComplaintBodySchema>;
export type ConfirmComplaintResolutionInput = z.infer<typeof confirmComplaintResolutionBodySchema>;
export type GetComplaintsQuery = z.infer<typeof getComplaintsQuerySchema>;
