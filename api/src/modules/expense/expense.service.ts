import { Types } from "mongoose";

import { Expense } from "./expense.model.js";
import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";

import { AppError } from "../../utils/AppError.js";

interface CreateExpenseInput {
  apartmentId: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: Date;
  createdBy?: string;
}

interface UpdateExpenseInput {
  title?: string;
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  vendorName?: string;
  expenseDate?: Date;
  status?: ExpenseStatus;
}

interface ExpenseFilters {
  apartmentId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
}

const validateObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ObjectId", 400);
  }
};

export const createExpenseService = async (
  input: CreateExpenseInput
) => {
  validateObjectId(input.apartmentId);

  if (input.createdBy) {
    validateObjectId(input.createdBy);
  }

  return Expense.create({
    ...input,
    status: ExpenseStatus.PENDING,
  });
};

export const getExpensesService = async (
  filters: ExpenseFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters.apartmentId) {
    validateObjectId(filters.apartmentId);
    query.apartmentId = filters.apartmentId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return Expense.find(query).sort({
    expenseDate: -1,
  });
};

export const getExpenseByIdService = async (
  expenseId: string
) => {
  validateObjectId(expenseId);

  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};

export const updateExpenseService = async (
  expenseId: string,
  input: UpdateExpenseInput
) => {
  validateObjectId(expenseId);

  const expense = await Expense.findByIdAndUpdate(
    expenseId,
    input,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};