import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { ObjectId, type Filter } from "mongodb";
import { getAuthDB } from "../config/auth-db.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type AuthUserRecord = {
    _id?: ObjectId;
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    apartmentId?: string | null;
    flatId?: string | null;
};

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
    const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

    if (ObjectId.isValid(userId)) {
        filters.push({ _id: new ObjectId(userId) });
    }

    return filters;
};

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        throw new AppError("Authentication required", 401);
    }

    const storedUser = await getAuthDB()
        .collection<AuthUserRecord>("user")
        .findOne({ $or: buildAuthUserIdFilters(session.user.id) });
    const sessionUser = session.user as typeof session.user & Partial<AuthUserRecord>;

    req.user = {
        ...session.user,
        name: storedUser?.name ?? sessionUser.name,
        email: storedUser?.email ?? sessionUser.email,
        role: storedUser?.role ?? sessionUser.role,
        phone: storedUser?.phone ?? sessionUser.phone,
        apartmentId: storedUser?.apartmentId ?? sessionUser.apartmentId ?? null,
        flatId: storedUser?.flatId ?? sessionUser.flatId ?? null,
    } as typeof session.user
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
