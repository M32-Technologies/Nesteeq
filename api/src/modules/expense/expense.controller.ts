import { Request, Response } from "express";

import {
  createExpenseService,
  getExpenseByIdService,
  getExpenseSummaryService,
  getExpensesService,
  updateExpenseService,
} from "./expense.service.js";

import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";

import { catchAsync } from "../../utils/catchAsync.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

export const createExpense = catchAsync(
  async (req: Request, res: Response) => {
    const expense = await createExpenseService(
      req.body,
      getAuditActor(req)
    );

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
      search: req.query.search as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  }
);

export const getExpenseSummary = catchAsync(
  async (req: Request, res: Response) => {
    const summary = await getExpenseSummaryService(
      req.query.apartmentId as string
    );

    res.status(200).json({
      success: true,
      data: summary,
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
      req.body,
      getAuditActor(req)
    );

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  }
);
