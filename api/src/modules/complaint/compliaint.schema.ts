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

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Text cannot exceed ${maxLength} characters`)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined));

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
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .refine(requireAtLeastOneField, {
    message: "At least one field is required",
  })
  .transform((data) => {
    const res: {
      title?: string;
      description?: string;
      category?: (typeof complaintCategories)[number];
      priority?: (typeof complaintPriorities)[number];
      estimatedCost?: number;
      remarks?: string;
    } = {};
    if (data.title !== undefined) res.title = data.title;
    if (data.description !== undefined) res.description = data.description;
    if (data.category !== undefined) res.category = data.category;
    if (data.priority !== undefined) res.priority = data.priority;
    if (data.estimatedCost !== undefined) res.estimatedCost = data.estimatedCost;
    const rem = data.remarks || data.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const assignComplaintBodySchema = z
  .object({
    assignedStaff: authUserIdSchema.optional(),
    assignedTo: authUserIdSchema.optional(),
    technicianId: authUserIdSchema.optional(),
    estimatedCost: costSchema.optional(),
    remarks: optionalText(1000),
    notes: optionalText(1000),
    scheduledDate: z.string().optional(),
    estimatedDurationHours: z.number().optional(),
  })
  .refine((data) => Boolean(data.assignedStaff || data.assignedTo || data.technicianId), {
    message: "Technician user ID is required",
    path: ["assignedStaff"],
  })
  .transform((data) => {
    const res: {
      assignedStaff: string;
      estimatedCost?: number;
      remarks?: string;
    } = {
      assignedStaff: (data.assignedStaff || data.assignedTo || data.technicianId)!,
    };
    if (data.estimatedCost !== undefined) res.estimatedCost = data.estimatedCost;
    const rem = data.remarks || data.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const updateComplaintStatusBodySchema = z
  .object({
    status: z.enum(complaintStatuses, {
      error: "Complaint status is required",
    }),
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const res: {
      status: (typeof complaintStatuses)[number];
      remarks?: string;
    } = {
      status: data.status,
    };
    const rem = data.remarks || data.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const completeComplaintWorkBodySchema = z
  .object({
    completionDetails: z
      .string()
      .trim()
      .min(10, "Completion details must be at least 10 characters")
      .max(3000, "Completion details cannot exceed 3000 characters"),
    finalCost: costSchema.optional(),
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const res: {
      completionDetails: string;
      finalCost?: number;
      remarks?: string;
    } = {
      completionDetails: data.completionDetails,
    };
    if (data.finalCost !== undefined) res.finalCost = data.finalCost;
    const rem = data.remarks || data.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const approveComplaintBodySchema = z
  .object({
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const rem = data.remarks || data.notes;
    const res: { remarks?: string } = {};
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const rejectComplaintBodySchema = z
  .object({
    reason: nonEmptyText("Rejection reason", 1000),
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const res: { reason: string; remarks?: string } = {
      reason: data.reason,
    };
    const rem = data.remarks || data.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const cancelComplaintBodySchema = z
  .object({
    reason: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const reason = data.reason || data.notes;
    const res: { reason?: string } = {};
    if (reason !== undefined) res.reason = reason;
    return res;
  });

export const confirmComplaintResolutionBodySchema = z
  .object({
    remarks: optionalText(1000),
    notes: optionalText(1000),
  })
  .transform((data) => {
    const rem = data.remarks || data.notes;
    const res: { remarks?: string } = {};
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const getComplaintsQuerySchema = z
  .object({
    status: z.enum([...complaintStatuses, "RESOLVED", "all"] as [string, ...string[]]).optional(),
    category: z.enum(complaintCategories).optional(),
    priority: z.enum(complaintPriorities).optional(),
    search: z.string().trim().optional(),
    apartment: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    flat: z.string().trim().min(1, "Flat ID cannot be empty").optional(),
    resident: authUserIdSchema.optional(),
    assignedStaff: authUserIdSchema.optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  });

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