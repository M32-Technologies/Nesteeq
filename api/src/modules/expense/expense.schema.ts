import { z } from "zod";

import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createExpenseSchema = z.object({
  body: z.object({
    apartmentId: objectIdSchema,

    title: z
      .string()
      .trim()
      .min(1, "Title is required"),

    description: z
      .string()
      .trim()
      .optional(),

    category: z.nativeEnum(ExpenseCategory),

    amount: z
      .number()
      .positive("Amount must be greater than 0"),

    vendorName: z
      .string()
      .trim()
      .optional(),

    expenseDate: z.coerce.date(),

    createdBy: objectIdSchema.optional(),
  }),
});

export const getExpensesSchema = z.object({
  query: z.object({
    apartmentId: objectIdSchema.optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
  }),
});

export const getExpenseByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    amount: z.number().positive().optional(),
    vendorName: z.string().trim().optional(),
    expenseDate: z.coerce.date().optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
  }),
});