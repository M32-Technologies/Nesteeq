import { z } from "zod";
import { complaintPriorities } from "../complaint/complaint.model.js";
import { scheduleStatuses, scheduleWorkTypes } from "./schedule.model.js";

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

const scheduleIdSchema = objectIdSchema("schedule");
const technicianIdSchema = objectIdSchema("technician");
const complaintIdSchema = objectIdSchema("complaint");
const maintenanceIdSchema = objectIdSchema("maintenance");

const dateSchema = z
  .string()
  .trim()
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }, "Date must be valid");

const timeSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${fieldName} must use HH:mm format`);

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

const requireAtLeastOneField = (data: Record<string, unknown>) => Object.keys(data).length > 0;

const validateWorkReference = (
  data: {
    workType?: string;
    complaint?: string;
    maintenance?: string;
  },
  context: z.RefinementCtx
) => {
  if (data.workType === "complaint" && !data.complaint) {
    context.addIssue({
      code: "custom",
      path: ["complaint"],
      message: "Complaint is required for complaint schedules",
    });
  }

  if (data.workType === "maintenance" && !data.maintenance) {
    context.addIssue({
      code: "custom",
      path: ["maintenance"],
      message: "Maintenance is required for maintenance schedules",
    });
  }

  if (data.workType === "complaint" && data.maintenance) {
    context.addIssue({
      code: "custom",
      path: ["maintenance"],
      message: "Maintenance cannot be set for complaint schedules",
    });
  }

  if (data.workType === "maintenance" && data.complaint) {
    context.addIssue({
      code: "custom",
      path: ["complaint"],
      message: "Complaint cannot be set for maintenance schedules",
    });
  }
};

const validateTimeRange = (
  data: {
    startTime?: string;
    endTime?: string;
  },
  context: z.RefinementCtx
) => {
  if (!data.startTime || !data.endTime) {
    return;
  }

  if (data.endTime <= data.startTime) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
};

export const scheduleIdParamsSchema = z.object({
  id: scheduleIdSchema,
});

export const scheduleDateParamsSchema = z.object({
  date: dateSchema,
});

export const scheduleStatusParamsSchema = z.object({
  status: z.enum(scheduleStatuses),
});

export const createScheduleBodySchema = z
  .object({
    title: nonEmptyText("Title", 120),
    description: optionalText("Description", 3000),
    technician: technicianIdSchema,
    workType: z.enum(scheduleWorkTypes, {
      error: "Work type is required",
    }),
    complaint: complaintIdSchema.optional(),
    maintenance: maintenanceIdSchema.optional(),
    scheduledDate: dateSchema,
    startTime: timeSchema("Start time"),
    endTime: timeSchema("End time"),
    priority: z.enum(complaintPriorities).default("MEDIUM"),
    notes: optionalText("Notes", 1000),
  })
  .strict()
  .superRefine((data, context) => {
    validateWorkReference(data, context);
    validateTimeRange(data, context);
  });

export const updateScheduleBodySchema = z
  .object({
    title: nonEmptyText("Title", 120).optional(),
    description: optionalText("Description", 3000),
    technician: technicianIdSchema.optional(),
    workType: z.enum(scheduleWorkTypes).optional(),
    complaint: complaintIdSchema.optional(),
    maintenance: maintenanceIdSchema.optional(),
    scheduledDate: dateSchema.optional(),
    startTime: timeSchema("Start time").optional(),
    endTime: timeSchema("End time").optional(),
    priority: z.enum(complaintPriorities).optional(),
    notes: optionalText("Notes", 1000),
  })
  .strict()
  .refine(requireAtLeastOneField, {
    message: "At least one field is required",
  })
  .superRefine((data, context) => {
    validateWorkReference(data, context);
    validateTimeRange(data, context);
  });

export const rescheduleBodySchema = z
  .object({
    technician: technicianIdSchema.optional(),
    scheduledDate: dateSchema,
    startTime: timeSchema("Start time"),
    endTime: timeSchema("End time"),
    notes: optionalText("Notes", 1000),
  })
  .strict()
  .superRefine(validateTimeRange);

export const cancelScheduleBodySchema = z
  .object({
    reason: optionalText("Cancellation reason", 1000),
  })
  .strict();

export const updateScheduleStatusBodySchema = z
  .object({
    status: z.enum(scheduleStatuses, {
      error: "Schedule status is required",
    }),
    notes: optionalText("Notes", 1000),
    completionDetails: optionalText("Completion details", 3000),
    finalCost: z.number().finite().min(0, "Final cost cannot be negative").optional(),
  })
  .strict();

export const getSchedulesQuerySchema = z
  .object({
    date: dateSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    technician: technicianIdSchema.optional(),
    status: z.enum(scheduleStatuses).optional(),
    priority: z.enum(complaintPriorities).optional(),
    workType: z.enum(scheduleWorkTypes).optional(),
    search: z.string().trim().max(120, "Search is too long").optional(),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const createScheduleSchema = z.object({
  body: createScheduleBodySchema,
});

export const getSchedulesSchema = z.object({
  query: getSchedulesQuerySchema,
});

export const getScheduleByIdSchema = z.object({
  params: scheduleIdParamsSchema,
});

export const updateScheduleSchema = z.object({
  params: scheduleIdParamsSchema,
  body: updateScheduleBodySchema,
});

export const rescheduleSchema = z.object({
  params: scheduleIdParamsSchema,
  body: rescheduleBodySchema,
});

export const cancelScheduleSchema = z.object({
  params: scheduleIdParamsSchema,
  body: cancelScheduleBodySchema,
});

export const updateScheduleStatusSchema = z.object({
  params: scheduleIdParamsSchema,
  body: updateScheduleStatusBodySchema,
});

export const deleteScheduleSchema = z.object({
  params: scheduleIdParamsSchema,
});

export const getSchedulesByDateSchema = z.object({
  params: scheduleDateParamsSchema,
  query: getSchedulesQuerySchema.omit({ date: true }),
});

export const getSchedulesByStatusSchema = z.object({
  params: scheduleStatusParamsSchema,
  query: getSchedulesQuerySchema.omit({ status: true }),
});

export type ScheduleIdParams = z.infer<typeof scheduleIdParamsSchema>;
export type ScheduleDateParams = z.infer<typeof scheduleDateParamsSchema>;
export type ScheduleStatusParams = z.infer<typeof scheduleStatusParamsSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleBodySchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleBodySchema>;
export type RescheduleInput = z.infer<typeof rescheduleBodySchema>;
export type CancelScheduleInput = z.infer<typeof cancelScheduleBodySchema>;
export type UpdateScheduleStatusInput = z.infer<typeof updateScheduleStatusBodySchema>;
export type GetSchedulesQuery = z.infer<typeof getSchedulesQuerySchema>;
