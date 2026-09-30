import { Router } from "express";

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
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer", "property_manager"));

router.get("/summary", zodValidate(getFinanceSummarySchema), getFinanceSummary);

router.get("/summary/:apartmentId", zodValidate(getFinanceSummarySchema), getFinanceSummary);

router.get("/monthly", zodValidate(getMonthlyFinanceSchema), getMonthlyFinance);

router.get("/monthly/:apartmentId", zodValidate(getMonthlyFinanceSchema), getMonthlyFinance);

export default router;