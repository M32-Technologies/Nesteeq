import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const getTreasurerDashboardSchema = z.object({
  params: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  query: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
});

export const getTreasurerChartSchema = z.object({
  params: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  query: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
      year: z.coerce.number().int().min(2000).max(2100).optional(),
    })
    .optional(),
});

export const updateTreasurerSettingsSchema = z.object({
  params: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  query: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  body: z.object({
    defaultLateFeePerDay: z.number().min(0).optional(),
    gracePeriodDays: z.number().int().min(0).max(30).optional(),
    currency: z.string().trim().min(1).max(10).optional(),
    fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
    autoReminderEnabled: z.boolean().optional(),
    emergencyReserveTarget: z.number().min(0).optional(),
  }),
});

export const getMaintenancePayoutsSchema = z.object({
  params: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  query: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
      search: z.string().trim().optional(),
    })
    .optional(),
});

export const processMaintenancePayoutSchema = z.object({
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format")
      .optional(),
    jobId: z
      .string()
      .regex(objectIdPattern, "Invalid jobId format"),
  }),
  query: z
    .object({
      apartmentId: z
        .string()
        .regex(objectIdPattern, "Invalid apartmentId format")
        .optional(),
    })
    .optional(),
  body: z.object({
    paymentMethod: z.string().trim().optional(),
    paymentReference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
});

