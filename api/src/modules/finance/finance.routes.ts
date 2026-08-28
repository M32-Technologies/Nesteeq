import { Router, type RequestHandler } from "express";

import {
  getFinanceSummary,
  getMonthlyFinance,
} from "./finance.controller.js";

import {
  getFinanceSummarySchema,
  getMonthlyFinanceSchema,
} from "./finance.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

const requireParamApartmentAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  ensureApartmentAccess(req, req.params.apartmentId);
  next();
};

const useAuthenticatedApartmentParam: RequestHandler = (
  req,
  _res,
  next
) => {
  req.params.apartmentId = getAuthenticatedApartmentId(req);
  next();
};

router.use(protect, requireRole("treasurer"));

router.get(
  "/summary",
  useAuthenticatedApartmentParam,
  zodValidate(getFinanceSummarySchema),
  getFinanceSummary
);

router.get(
  "/summary/:apartmentId",
  zodValidate(getFinanceSummarySchema),
  requireParamApartmentAccess,
  getFinanceSummary
);

router.get(
  "/monthly",
  useAuthenticatedApartmentParam,
  zodValidate(getMonthlyFinanceSchema),
  getMonthlyFinance
);

router.get(
  "/monthly/:apartmentId",
  zodValidate(getMonthlyFinanceSchema),
  requireParamApartmentAccess,
  getMonthlyFinance
);

export default router;
