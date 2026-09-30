import { Request, Response } from "express";

import {
  getFinanceSummaryService,
  getMonthlyFinanceService,
} from "./finance.service.js";

import { catchAsync } from "../../utils/catchAsync.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

const getApartmentId = (req: Request) => {
  const apartmentId = (req.params.apartmentId as string) || getAuthenticatedApartmentId(req);
  if (req.params.apartmentId) {
    ensureApartmentAccess(req, req.params.apartmentId);
  }
  return apartmentId;
};

export const getFinanceSummary = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
    const summary = await getFinanceSummaryService(apartmentId);

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

    const apartmentId = getApartmentId(req);
    const data = await getMonthlyFinanceService(
      apartmentId,
      month,
      year
    );

    res.status(200).json({
      success: true,
      data,
    });
  }
);