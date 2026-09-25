import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getTreasurerDashboardService,
  getTreasurerChartService,
  getTreasurerSettingsService,
  updateTreasurerSettingsService,
  getMaintenancePayoutsService,
  processMaintenancePayoutService,
  getDefaultersReportService,
  getExpenseBreakdownReportService,
} from "./treasurer.service.js";

export const getTreasurerDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const data = await getTreasurerDashboardService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const getTreasurerChart = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await getTreasurerChartService(apartmentId, year);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const getTreasurerSettings = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const data = await getTreasurerSettingsService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const updateTreasurerSettings = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const data = await updateTreasurerSettingsService(apartmentId, req.body);

    res.status(200).json({
      success: true,
      message: "Treasurer settings updated successfully",
      data,
    });
  }
);

export const getMaintenancePayouts = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const data = await getMaintenancePayoutsService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const processMaintenancePayout = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.params.apartmentId as string;
    const jobId = req.params.jobId as string;
    const user = req.user as
      | { id?: string; _id?: { toString: () => string }; name?: string }
      | undefined;
    const userId = user?.id || user?._id?.toString() || "Treasurer";

    const data = await processMaintenancePayoutService(
      jobId,
      apartmentId,
      req.body,
      { userId, name: user?.name }
    );

    res.status(200).json({
      success: true,
      message: data.message,
      data: data.expense,
    });
  }
);

export const getDefaultersReport = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = (req.params.apartmentId || req.query.apartmentId || req.user?.apartmentId) as string;
    const { overdueDays, search, page, limit } = req.query;

    const data = await getDefaultersReportService(apartmentId, {
      overdueDays: overdueDays ? Number(overdueDays) : undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const getExpenseBreakdownReport = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = (req.params.apartmentId || req.query.apartmentId || req.user?.apartmentId) as string;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : undefined;

    const data = await getExpenseBreakdownReportService(apartmentId, year, month);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

