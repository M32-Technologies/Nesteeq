import { Request , Response , NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { hasExactRole } from "../utils/role.js";

export const authorize  = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("You are not logged in. Please sign in to continue.", 401));
        }

        if (!hasExactRole(req.user.role, allowedRoles)) {
            return next(new AppError("You do not have permission to perform this action.", 403));
        }

        next();
    };
};
