import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getComplaintReport,
  getCostReport,
  getMaintenanceReport,
  getPendingWorkReport,
  getReportsOverview,
  getTechnicianReport,
  type AuthenticatedReportUser,
} from "./report.service.js";
import type { ReportQuery } from "./report.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedReportUser => {
  if (!req.user?.id || !req.user.role) {
    throw new AppError("Authentication required", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    apartmentId: req.user.apartmentId ?? null,
    flatId: req.user.flatId ?? null,
  };
};

const getQuery = (req: Request): ReportQuery => req.query as unknown as ReportQuery;

export const getReportsOverviewHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getReportsOverview(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getComplaintReportHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getComplaintReport(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMaintenanceReportHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getMaintenanceReport(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getTechnicianReportHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getTechnicianReport(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getCostReportHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getCostReport(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getPendingWorkReportHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getPendingWorkReport(getQuery(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});
