import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const getTreasurerDashboardSchema = z.object({
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format"),
  }),
});

export const getTreasurerChartSchema = z.object({
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format"),
  }),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const updateTreasurerSettingsSchema = z.object({
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format"),
  }),
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
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format"),
  }),
});

export const processMaintenancePayoutSchema = z.object({
  params: z.object({
    apartmentId: z
      .string()
      .regex(objectIdPattern, "Invalid apartmentId format"),
    jobId: z
      .string()
      .regex(objectIdPattern, "Invalid jobId format"),
  }),
  body: z.object({
    paymentMethod: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
});

