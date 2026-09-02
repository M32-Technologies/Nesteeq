import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type ApartmentIdValue =
    | string
    | { toString: () => string }
    | null
    | undefined;

const normalizeRole = (role: string) =>
    role.trim().toLowerCase().replace(/[\s-]+/g, "_");

const normalizeApartmentId = (apartmentId: ApartmentIdValue) =>
    apartmentId?.toString().trim().toLowerCase();

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });


    if (!session) {
        throw new AppError("Authentication required", 401);
    }
    req.user = session.user
    req.session = session.session

    next();
});

export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("You are not logged in. Please sign in to continue.", 401));
        }

        const userRole = normalizeRole(req.user.role);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

        if (!normalizedAllowedRoles.includes(userRole)) {
            return next(new AppError("You do not have permission to perform this action.", 403));
        }

        next();
    };
};

export const getAuthenticatedApartmentId = (req: Request) => {
    if (!req.user) {
        throw new AppError("You are not logged in. Please sign in to continue.", 401);
    }

    const apartmentId = normalizeApartmentId(req.user.apartmentId);

    if (!apartmentId) {
        throw new AppError("Apartment access is not configured for this user.", 403);
    }

    return apartmentId;
};

export const ensureApartmentAccess = (
    req: Request,
    requestedApartmentId: ApartmentIdValue
) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    const normalizedRequestedApartmentId =
        normalizeApartmentId(requestedApartmentId);

    if (!normalizedRequestedApartmentId) {
        throw new AppError("Apartment access is required.", 403);
    }

    if (normalizedRequestedApartmentId !== authenticatedApartmentId) {
        throw new AppError("You do not have permission to access this apartment.", 403);
    }

    return authenticatedApartmentId;
};