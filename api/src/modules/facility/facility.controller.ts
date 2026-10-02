import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getFacilityDashboard,
  type AuthenticatedFacilityUser,
} from "./facility.service.js";

const getAuthenticatedUser = (req: Request): AuthenticatedFacilityUser => {
  const user = req.user as Record<string, unknown> | undefined;
  const userId = req.user?.id ? String(req.user.id).trim() : (user?._id ? String(user._id).trim() : "");
  const role = req.user?.role ? String(req.user.role).trim() : "";
  const rawApartmentId = user?.apartmentId ?? user?.apartment ?? null;

  if (!userId || !role) {
    throw new AppError("Authentication required", 401);
  }

  return {
    id: userId,
    role: role,
    apartmentId: rawApartmentId ? String(rawApartmentId).trim() : null,
  };
};

export const getFacilityDashboardHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getFacilityDashboard(getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});
