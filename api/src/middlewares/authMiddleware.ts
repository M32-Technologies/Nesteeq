import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });


    if (!session) {
        throw new AppError("Authentication required", 401);
    }
    console.log(session.session)
    req.user = session.user
    req.session = session.session

    next();
});

export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("You are not logged in. Please sign in to continue.", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action.", 403));
        }

        next();
    };
};