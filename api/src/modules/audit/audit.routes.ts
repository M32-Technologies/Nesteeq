import {
  Router,
  type Request,
  type RequestHandler,
} from "express";

import {
  getAuditById,
  getAuditLogs,
} from "./audit.controller.js";

import {
  getAuditByIdSchema,
  getAuditLogsSchema,
} from "./audit.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { Audit } from "./audit.model.js";

const router = Router();

const setQueryApartmentId = (
  req: Request,
  apartmentId: string
) => {
  Object.defineProperty(req, "query", {
    value: {
      ...req.query,
      apartmentId,
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const requireQueryApartmentAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  const authenticatedApartmentId =
    getAuthenticatedApartmentId(req);

  if (req.query.apartmentId) {
    ensureApartmentAccess(
      req,
      req.query.apartmentId as string
    );
  }

  setQueryApartmentId(req, authenticatedApartmentId);
  next();
};

const requireAuditApartmentAccess = catchAsync(
  async (req, _res, next) => {
    const audit = await Audit.findById(req.params.id)
      .select("apartmentId")
      .lean();

    if (!audit) {
      throw new AppError("Audit log not found", 404);
    }

    ensureApartmentAccess(req, audit.apartmentId);
    next();
  }
);

router.use(protect, requireRole("treasurer"));

router.get(
  "/",
  zodValidate(getAuditLogsSchema),
  requireQueryApartmentAccess,
  getAuditLogs
);

router.get(
  "/:id",
  zodValidate(getAuditByIdSchema),
  requireAuditApartmentAccess,
  getAuditById
);

export default router;