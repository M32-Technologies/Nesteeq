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
    images: z.array(z.string().trim()).optional().default([]),
    attachments: z.array(z.string().trim()).optional().default([]),
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
    images: z.array(z.string().trim()).optional(),
    attachments: z.array(z.string().trim()).optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
    notes: nonEmptyText("Notes", 1000).optional(),
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
    const rem = data.remarks || (data as { notes?: string })?.notes;
    if (rem !== undefined) res.remarks = rem;
    return res;
  });

export const assignComplaintBodySchema = z
  .object({
    assignedStaff: z.string().trim().min(1, "Assigned staff is required").optional().nullable(),
    assignedTo: z.string().trim().min(1, "Assigned staff is required").optional().nullable(),
    technicianId: z.string().trim().min(1).optional().nullable(),
    estimatedCost: costSchema.optional().nullable(),
    remarks: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  })
  .passthrough()
  .refine(
    (data) => Boolean(data.assignedStaff || data.assignedTo || data.technicianId),
    {
      message: "Assigned staff is required",
    }
  );

export const updateComplaintStatusBodySchema = z
  .object({
    status: z.enum(complaintStatuses, {
      error: "Complaint status is required",
    }),
    remarks: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  })
  .passthrough();

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
    remarks: z.string().trim().max(1000).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

export const rejectComplaintBodySchema = z
  .object({
    reason: z.string().trim().max(1000).optional().nullable(),
    remarks: z.string().trim().max(1000).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

export const cancelComplaintBodySchema = z
  .object({
    reason: z.string().trim().max(1000).optional().nullable(),
    remarks: z.string().trim().max(1000).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

export const confirmComplaintResolutionBodySchema = z
  .object({
    remarks: z.string().trim().max(1000).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

const preprocessEnumFilter = <T extends readonly string[]>(
  allowedValues: T,
  transform?: (val: string) => string
) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === "all") return undefined;
      return transform ? transform(trimmed) : trimmed;
    }
    return val;
  }, z.enum(allowedValues as unknown as [string, ...string[]]).optional());

export const getComplaintsQuerySchema = z
  .object({
    status: preprocessEnumFilter(complaintStatuses, (s) =>
      s.toUpperCase().replace(/[\s-]+/g, "_")
    ),
    category: preprocessEnumFilter(complaintCategories, (c) => c.toUpperCase()),
    priority: preprocessEnumFilter(complaintPriorities, (p) => p.toUpperCase()),
    apartment: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    apartmentId: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    flat: z.string().trim().min(1, "Flat ID cannot be empty").optional(),
    flatId: z.string().trim().min(1, "Flat ID cannot be empty").optional(),
    resident: authUserIdSchema.optional(),
    residentId: authUserIdSchema.optional(),
    assignedStaff: authUserIdSchema.optional(),
    assignedTo: authUserIdSchema.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .passthrough();

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

export const reviewComplaintExpenseBodySchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "APPROVED", "REJECTED"]).optional(),
    reason: z.string().trim().max(1000).optional().nullable(),
    remarks: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

export const reviewComplaintExpenseSchema = z.object({
  params: complaintIdParamsSchema,
  body: reviewComplaintExpenseBodySchema,
});

export const approveComplaintExpenseBodySchema = z
  .object({
    remarks: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough()
  .optional();

export const approveComplaintExpenseSchema = z.object({
  params: complaintIdParamsSchema,
  body: approveComplaintExpenseBodySchema,
});

export const rejectComplaintExpenseBodySchema = z
  .object({
    reason: z.string().trim().max(1000).optional().nullable(),
    remarks: z.string().trim().max(1000).optional().nullable(),
  })
  .passthrough();

export const rejectComplaintExpenseSchema = z.object({
  params: complaintIdParamsSchema,
  body: rejectComplaintExpenseBodySchema,
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
export type ReviewComplaintExpenseInput = z.infer<typeof reviewComplaintExpenseBodySchema>;
export type ApproveComplaintExpenseInput = z.infer<typeof approveComplaintExpenseBodySchema>;
export type RejectComplaintExpenseInput = z.infer<typeof rejectComplaintExpenseBodySchema>;
export type GetComplaintsQuery = z.infer<typeof getComplaintsQuerySchema>;