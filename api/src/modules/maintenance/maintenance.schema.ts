import { z } from "zod";
import {
  complaintCategories,
  complaintPriorities,
} from "../complaint/complaint.model.js";
import {
  maintenanceCostStatuses,
  maintenanceStatuses,
} from "./maintenance.model.js";

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

const userIdSchema = objectIdSchema("user");
const maintenanceIdSchema = objectIdSchema("maintenance");
const complaintIdSchema = objectIdSchema("complaint");

const nonEmptyText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(120, "Title cannot exceed 120 characters");

const descriptionSchema = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(3000, "Description cannot exceed 3000 characters");

const costSchema = z
  .number()
  .finite("Cost must be a valid number")
  .min(0, "Cost cannot be negative");

const requireAtLeastOneField = (data: Record<string, unknown>) => Object.keys(data).length > 0;

export const maintenanceIdParamsSchema = z.object({
  id: maintenanceIdSchema,
});

export const createMaintenanceBodySchema = z
  .object({
    complaint: complaintIdSchema,
    assignedStaff: userIdSchema.optional(),
    category: z.enum(complaintCategories).optional(),
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    priority: z.enum(complaintPriorities).optional(),
    estimatedCost: costSchema.optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const updateMaintenanceBodySchema = z
  .object({
    category: z.enum(complaintCategories).optional(),
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    priority: z.enum(complaintPriorities).optional(),
    estimatedCost: costSchema.optional(),
    managerRemarks: nonEmptyText("Manager remarks", 1000).optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, {
    message: "At least one field is required",
  });

export const assignMaintenanceBodySchema = z
  .object({
    assignedStaff: userIdSchema,
    estimatedCost: costSchema.optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const updateMaintenanceStatusBodySchema = z
  .object({
    status: z.enum(maintenanceStatuses, {
      error: "Maintenance status is required",
    }),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const startMaintenanceBodySchema = z
  .object({
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const updateMaintenanceProgressBodySchema = z
  .object({
    progressDetails: z
      .string()
      .trim()
      .min(5, "Progress details must be at least 5 characters")
      .max(3000, "Progress details cannot exceed 3000 characters"),
    status: z.enum(["IN_PROGRESS", "ON_HOLD"]).optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const completeMaintenanceBodySchema = z
  .object({
    completionDetails: z
      .string()
      .trim()
      .min(10, "Completion details must be at least 10 characters")
      .max(3000, "Completion details cannot exceed 3000 characters"),
    finalCost: costSchema.optional(),
    workNotes: nonEmptyText("Work notes", 3000).optional(),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const approveMaintenanceBodySchema = z
  .object({
    remarks: nonEmptyText("Approval remarks", 1000).optional(),
  })
  .strict();

export const rejectMaintenanceBodySchema = z
  .object({
    reason: nonEmptyText("Rejection reason", 1000),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const cancelMaintenanceBodySchema = z
  .object({
    reason: nonEmptyText("Cancellation reason", 1000).optional(),
  })
  .strict();

export const closeMaintenanceBodySchema = z
  .object({
    remarks: nonEmptyText("Closing remarks", 1000).optional(),
  })
  .strict();

export const approveMaintenanceCostBodySchema = z
  .object({
    remarks: nonEmptyText("Cost approval remarks", 1000).optional(),
  })
  .strict();

export const rejectMaintenanceCostBodySchema = z
  .object({
    reason: nonEmptyText("Cost rejection reason", 1000),
    remarks: nonEmptyText("Remarks", 1000).optional(),
  })
  .strict();

export const getMaintenanceQuerySchema = z
  .object({
    status: z.enum(maintenanceStatuses).optional(),
    category: z.enum(complaintCategories).optional(),
    priority: z.enum(complaintPriorities).optional(),
    complaint: complaintIdSchema.optional(),
    apartment: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    flat: z.string().trim().min(1, "Flat ID cannot be empty").optional(),
    resident: userIdSchema.optional(),
    assignedStaff: userIdSchema.optional(),
    costStatus: z.enum(maintenanceCostStatuses).optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const createMaintenanceSchema = z.object({
  body: createMaintenanceBodySchema,
});

export const getMaintenanceSchema = z.object({
  query: getMaintenanceQuerySchema,
});

export const getMaintenanceByIdSchema = z.object({
  params: maintenanceIdParamsSchema,
});

export const updateMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: updateMaintenanceBodySchema,
});

export const assignMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: assignMaintenanceBodySchema,
});

export const updateMaintenanceStatusSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: updateMaintenanceStatusBodySchema,
});

export const startMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: startMaintenanceBodySchema,
});

export const updateMaintenanceProgressSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: updateMaintenanceProgressBodySchema,
});

export const completeMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: completeMaintenanceBodySchema,
});

export const approveMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: approveMaintenanceBodySchema,
});

export const rejectMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: rejectMaintenanceBodySchema,
});

export const cancelMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: cancelMaintenanceBodySchema,
});

export const closeMaintenanceSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: closeMaintenanceBodySchema,
});

export const approveMaintenanceCostSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: approveMaintenanceCostBodySchema,
});

export const rejectMaintenanceCostSchema = z.object({
  params: maintenanceIdParamsSchema,
  body: rejectMaintenanceCostBodySchema,
});

export type MaintenanceIdParams = z.infer<typeof maintenanceIdParamsSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceBodySchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceBodySchema>;
export type AssignMaintenanceInput = z.infer<typeof assignMaintenanceBodySchema>;
export type UpdateMaintenanceStatusInput = z.infer<typeof updateMaintenanceStatusBodySchema>;
export type StartMaintenanceInput = z.infer<typeof startMaintenanceBodySchema>;
export type UpdateMaintenanceProgressInput = z.infer<typeof updateMaintenanceProgressBodySchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceBodySchema>;
export type ApproveMaintenanceInput = z.infer<typeof approveMaintenanceBodySchema>;
export type RejectMaintenanceInput = z.infer<typeof rejectMaintenanceBodySchema>;
export type CancelMaintenanceInput = z.infer<typeof cancelMaintenanceBodySchema>;
export type CloseMaintenanceInput = z.infer<typeof closeMaintenanceBodySchema>;
export type ApproveMaintenanceCostInput = z.infer<typeof approveMaintenanceCostBodySchema>;
export type RejectMaintenanceCostInput = z.infer<typeof rejectMaintenanceCostBodySchema>;
export type GetMaintenanceQuery = z.infer<typeof getMaintenanceQuerySchema>;
