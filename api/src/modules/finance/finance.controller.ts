import { Request, Response } from "express";

import {
  getFinanceSummaryService,
  getMonthlyFinanceService,
} from "./finance.service.js";

import { catchAsync } from "../../utils/catchAsync.js";

export const getFinanceSummary = catchAsync(
  async (req: Request, res: Response) => {
    const summary = await getFinanceSummaryService(
      req.params.apartmentId as string
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
);

export const getMonthlyFinance = catchAsync(
  async (req: Request, res: Response) => {
    const month = req.query.month
      ? Number(req.query.month)
      : undefined;

    const year = req.query.year
      ? Number(req.query.year)
      : undefined;

    const data = await getMonthlyFinanceService(
      req.params.apartmentId as string,
      month,
      year
    );

    res.status(200).json({
      success: true,
      data,
    });
  }
);