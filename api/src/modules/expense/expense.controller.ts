import { Request, Response } from "express";

import {
  createExpenseService,
  exportExpensesCsvService,
  getExpenseByIdService,
  getExpenseSummaryService,
  getExpensesService,
  updateExpenseService,
} from "./expense.service.js";

import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";
import { Expense } from "./expense.model.js";

import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

export const createExpense = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }

    const expense = await createExpenseService(
      { ...req.body, apartmentId },
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
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const expenses = await getExpensesService({
      apartmentId: authenticatedApartmentId,
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

export const exportExpensesCsv = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const { csvContent, filename } = await exportExpensesCsvService({
      apartmentId: authenticatedApartmentId,
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

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }
);


export const getExpenseSummary = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const summary = await getExpenseSummaryService(authenticatedApartmentId);

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

    ensureApartmentAccess(req, expense.apartmentId);

    res.status(200).json({
      success: true,
      data: expense,
    });
  }
);

export const updateExpense = catchAsync(
  async (req: Request, res: Response) => {
    const existing = await Expense.findById(req.params.id as string).select("apartmentId").lean();
    if (!existing) {
      throw new AppError("Expense not found", 404);
    }
    ensureApartmentAccess(req, existing.apartmentId);

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
