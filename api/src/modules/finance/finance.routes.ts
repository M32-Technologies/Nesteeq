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

const router = Router();

router.get("/summary/:apartmentId", zodValidate(getFinanceSummarySchema), getFinanceSummary);
router.get("/monthly/:apartmentId", zodValidate(getMonthlyFinanceSchema), getMonthlyFinance);

export default router;