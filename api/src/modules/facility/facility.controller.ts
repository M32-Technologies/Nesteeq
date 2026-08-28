import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getFacilityDashboard,
  type AuthenticatedFacilityUser,
} from "./facility.service.js";

const getAuthenticatedUser = (req: Request): AuthenticatedFacilityUser => {
  if (!req.user?.id || !req.user.role) {
    throw new AppError("Authentication required", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    apartmentId: req.user.apartmentId ?? null,
  };
};

export const getFacilityDashboardHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getFacilityDashboard(getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});
