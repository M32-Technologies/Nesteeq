import { z } from "zod";
import {
  complaintCategories,
  complaintStatuses,
} from "../complaint/complaint.model.js";
import { maintenanceStatuses } from "../maintenance/maintenance.model.js";
import { technicianStatuses } from "../technician/technician.model.js";

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

const optionalDateSchema = z.coerce.date().optional();

export const reportQuerySchema = z
  .object({
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    apartment: z.string().trim().min(1, "Apartment ID cannot be empty").optional(),
    technician: z.string().trim().min(1, "Technician ID cannot be empty").optional(),
    category: z.enum(complaintCategories).optional(),
    complaintStatus: z.enum(complaintStatuses).optional(),
    maintenanceStatus: z.enum(maintenanceStatuses).optional(),
    technicianStatus: z.enum(technicianStatuses).optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.startDate <= data.endDate;
    },
    {
      message: "Start date must be before end date",
      path: ["startDate"],
    }
  );

export const getReportsSchema = z.object({
  query: reportQuerySchema,
});

export const reportTechnicianParamsSchema = z.object({
  id: objectIdSchema("technician"),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
