import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getAuthenticatedApartmentId } from "../../middlewares/authMiddleware.js";
import {
  getTreasurerDashboardService,
  getTreasurerChartService,
  getTreasurerSettingsService,
  updateTreasurerSettingsService,
  getMaintenancePayoutsService,
  processMaintenancePayoutService,
  getDefaultersReportService,
  getExpenseBreakdownReportService,
  exportTreasurerReportCsvService,
} from "./treasurer.service.js";

const getApartmentId = (req: Request) =>
  (req.params.apartmentId || req.query.apartmentId || getAuthenticatedApartmentId(req)) as string;

export const getTreasurerDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
    const data = await getTreasurerDashboardService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const getTreasurerChart = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
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
    const apartmentId = getApartmentId(req);
    const data = await getTreasurerSettingsService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const updateTreasurerSettings = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
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
    const apartmentId = getApartmentId(req);
    const data = await getMaintenancePayoutsService(apartmentId);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const processMaintenancePayout = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
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
    const apartmentId = getApartmentId(req);
    const { overdueDays, days, search, page, limit } = req.query;

    const data = await getDefaultersReportService(apartmentId, {
      overdueDays: overdueDays ? Number(overdueDays) : days ? Number(days) : undefined,
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
    const apartmentId = getApartmentId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;

    const data = await getExpenseBreakdownReportService(
      apartmentId,
      year,
      month,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const exportTreasurerReportCsv = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getApartmentId(req);
    const type = (req.query.type as "summary" | "defaulters" | "expenses") || "summary";
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const days = req.query.days ? Number(req.query.days) : undefined;
    const overdueDays = req.query.overdueDays ? Number(req.query.overdueDays) : undefined;
    const search = req.query.search as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const { csvContent, filename } = await exportTreasurerReportCsvService(
      apartmentId,
      {
        type,
        year,
        month,
        days,
        overdueDays,
        search,
        startDate,
        endDate,
      }
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }
);


