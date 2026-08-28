import { Router, type Request, type RequestHandler } from "express";

import { getPayments } from "./payment.controller.js";
import { getPaymentsSchema } from "./payment.schema.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

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

router.use(protect, requireRole("treasurer"));

router.get(
  "/",
  zodValidate(getPaymentsSchema),
  requireQueryApartmentAccess,
  getPayments
);

export default router;
