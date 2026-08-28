import { z } from "zod";
import {
  complaintCategories,
  complaintStatuses,
} from "../complaint/complaint.model.js";
import { maintenanceStatuses } from "../maintenance/maintenance.model.js";
import { technicianStatuses } from "./technician.model.js";

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

const userIdSchema = objectIdSchema("user");
const technicianIdSchema = objectIdSchema("technician");
const workIdSchema = objectIdSchema("work");

const nonEmptyText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} cannot be empty`)
    .max(maxLength, `${fieldName} is too long`)
    .optional();

const costSchema = z
  .number()
  .finite("Cost must be a valid number")
  .min(0, "Cost cannot be negative");

const workStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const;

const requireAtLeastOneField = (data: Record<string, unknown>) => Object.keys(data).length > 0;

export const technicianIdParamsSchema = z.object({
  id: technicianIdSchema,
});

export const createTechnicianBodySchema = z
  .object({
    userId: userIdSchema,
    fullName: nonEmptyText("Full name", 120),
    email: z.string().trim().email("Invalid email address").max(180).optional(),
    phone: optionalText("Phone", 30),
    apartmentId: optionalText("Apartment ID", 80),
    employeeCode: optionalText("Employee code", 40),
    specializations: z.array(z.enum(complaintCategories)).max(8).default([]),
    status: z.enum(technicianStatuses).default("ACTIVE"),
    shift: optionalText("Shift", 80),
    notes: optionalText("Notes", 1000),
  })
  .strict();

export const updateTechnicianBodySchema = z
  .object({
    fullName: nonEmptyText("Full name", 120).optional(),
    email: z.string().trim().email("Invalid email address").max(180).optional(),
    phone: optionalText("Phone", 30),
    apartmentId: optionalText("Apartment ID", 80),
    employeeCode: optionalText("Employee code", 40),
    specializations: z.array(z.enum(complaintCategories)).max(8).optional(),
    shift: optionalText("Shift", 80),
    notes: optionalText("Notes", 1000),
  })
  .strict()
  .refine(requireAtLeastOneField, {
    message: "At least one field is required",
  });

export const updateTechnicianStatusBodySchema = z
  .object({
    status: z.enum(technicianStatuses, {
      error: "Technician status is required",
    }),
    notes: optionalText("Notes", 1000),
  })
  .strict();

export const assignTechnicianWorkBodySchema = z
  .object({
    workType: z.enum(["complaint", "maintenance"], {
      error: "Work type is required",
    }),
    workId: workIdSchema,
    estimatedCost: costSchema.optional(),
    remarks: optionalText("Remarks", 1000),
  })
  .strict();

export const updateTechnicianTaskStatusBodySchema = z
  .object({
    workType: z.enum(["complaint", "maintenance"], {
      error: "Work type is required",
    }),
    workId: workIdSchema,
    status: z.enum(workStatuses, {
      error: "Work status is required",
    }),
    remarks: optionalText("Remarks", 1000),
    progressDetails: optionalText("Progress details", 3000),
    completionDetails: optionalText("Completion details", 3000),
    finalCost: costSchema.optional(),
    workNotes: optionalText("Work notes", 3000),
  })
  .strict();

export const getTechniciansQuerySchema = z
  .object({
    status: z.enum(technicianStatuses).optional(),
    specialization: z.enum(complaintCategories).optional(),
    apartmentId: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    search: z.string().trim().max(120, "Search is too long").optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const getTechnicianTasksQuerySchema = z
  .object({
    type: z.enum(["all", "complaint", "maintenance"]).default("all"),
    complaintStatus: z.enum(complaintStatuses).optional(),
    maintenanceStatus: z.enum(maintenanceStatuses).optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const createTechnicianSchema = z.object({
  body: createTechnicianBodySchema,
});

export const getTechniciansSchema = z.object({
  query: getTechniciansQuerySchema,
});

export const getTechnicianByIdSchema = z.object({
  params: technicianIdParamsSchema,
});

export const updateTechnicianSchema = z.object({
  params: technicianIdParamsSchema,
  body: updateTechnicianBodySchema,
});

export const updateTechnicianStatusSchema = z.object({
  params: technicianIdParamsSchema,
  body: updateTechnicianStatusBodySchema,
});

export const deleteTechnicianSchema = z.object({
  params: technicianIdParamsSchema,
});

export const assignTechnicianWorkSchema = z.object({
  params: technicianIdParamsSchema,
  body: assignTechnicianWorkBodySchema,
});

export const getTechnicianTasksSchema = z.object({
  params: technicianIdParamsSchema,
  query: getTechnicianTasksQuerySchema,
});

export const updateTechnicianTaskStatusSchema = z.object({
  params: technicianIdParamsSchema,
  body: updateTechnicianTaskStatusBodySchema,
});

export type TechnicianIdParams = z.infer<typeof technicianIdParamsSchema>;
export type CreateTechnicianInput = z.infer<typeof createTechnicianBodySchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianBodySchema>;
export type UpdateTechnicianStatusInput = z.infer<typeof updateTechnicianStatusBodySchema>;
export type AssignTechnicianWorkInput = z.infer<typeof assignTechnicianWorkBodySchema>;
export type UpdateTechnicianTaskStatusInput = z.infer<typeof updateTechnicianTaskStatusBodySchema>;
export type GetTechniciansQuery = z.infer<typeof getTechniciansQuerySchema>;
export type GetTechnicianTasksQuery = z.infer<typeof getTechnicianTasksQuerySchema>;
