import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getAlerts,
  markAlertRead,
  type AuthenticatedAlertUser,
} from "./alert.service.js";
import type {
  AlertIdParams,
  GetAlertsQuery,
} from "./alert.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedAlertUser => {
  if (!req.user?.id || !req.user.role) {
    throw new AppError("Authentication required", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    apartmentId: req.user.apartmentId ?? null,
  };
};

export const getAlertsHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getAlerts(
    req.query as unknown as GetAlertsQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const markAlertReadHandler = catchAsync(async (req: Request, res: Response) => {
  const params = req.params as AlertIdParams;
  const result = await markAlertRead(params.id, getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    message: "Alert marked as read",
    data: result,
  });
});
