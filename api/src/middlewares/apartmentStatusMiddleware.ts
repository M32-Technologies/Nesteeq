import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Apartment } from "../modules/apartment/apartment.model.js";

type ApartmentIdValue = string | { toString: () => string } | null | undefined;

const normalizeRole = (role?: string | null) =>
  (role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

const normalizeApartmentId = (apartmentId: ApartmentIdValue) =>
  apartmentId?.toString().trim().toLowerCase();

/**
 * Resolves the apartment document associated with the authenticated user.
 * Bypasses platform admins (super_admin, admin).
 */
export const resolveUserApartment = async (req: Request) => {
  if (!req.user) return null;

  const userRole = normalizeRole(req.user.role);
  if (userRole === "admin" || userRole === "super_admin") {
    return null;
  }

  let apartmentId = normalizeApartmentId(req.user.apartmentId);

  // If user is property_manager and apartmentId is not yet on session, check managerId
  if (!apartmentId && userRole === "property_manager" && req.user.id) {
    const apt = await Apartment.findOne({ managerId: req.user.id }).select(
      "_id name status inactiveReason"
    );
    if (apt) {
      apartmentId = apt._id.toString();
    }
  }

  if (!apartmentId || !isValidObjectId(apartmentId)) {
    return null;
  }

  return Apartment.findById(apartmentId).select(
    "_id name status inactiveReason"
  );
};

/**
 * Verifies that the user's apartment is active.
 * Rejects with 403 and APARTMENT_INACTIVE if the apartment status is inactive.
 */
export const verifyApartmentActive = async (req: Request): Promise<void> => {
  if (!req.user) return;

  const userRole = normalizeRole(req.user.role);
  if (userRole === "admin" || userRole === "super_admin") {
    return;
  }

  // Exempt apartment status check endpoint itself
  const url = req.originalUrl || req.url || "";
  if (url.includes("/apartment/status")) {
    return;
  }

  const apartment = await resolveUserApartment(req);
  if (!apartment) {
    return;
  }

  if (apartment.status === "inactive") {
    throw new AppError(
      "This apartment is currently inactive. Platform access is temporarily restricted.",
      403,
      {
        apartmentId: apartment._id.toString(),
        apartmentName: apartment.name,
        status: "inactive",
        inactiveReason: apartment.inactiveReason,
      },
      "APARTMENT_INACTIVE"
    );
  }
};

/**
 * Standalone Express middleware to verify apartment active status.
 */
export const requireActiveApartment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await verifyApartmentActive(req);
    next();
  }
);
