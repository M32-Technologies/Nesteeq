import { Request, Response } from "express";

import {
  createExpenseService,
  getExpenseByIdService,
  getExpensesService,
  updateExpenseService,
} from "./expense.service.js";

import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";

import { catchAsync } from "../../utils/catchAsync.js";

export const createExpense = catchAsync(
  async (req: Request, res: Response) => {
    const expense = await createExpenseService(req.body);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  }
);

export const getExpenses = catchAsync(
  async (req: Request, res: Response) => {
    const expenses = await getExpensesService({
      apartmentId: req.query.apartmentId as string,
      category: req.query.category as ExpenseCategory,
      status: req.query.status as ExpenseStatus,
    });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  }
);

export const getExpenseById = catchAsync(
  async (req: Request, res: Response) => {
    const expense = await getExpenseByIdService(
      req.params.id as string
    );

    res.status(200).json({
      success: true,
      data: expense,
    });
  }
);

export const updateExpense = catchAsync(
  async (req: Request, res: Response) => {
    const expense = await updateExpenseService(
      req.params.id as string,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  }
);
