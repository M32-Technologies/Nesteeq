import { Router } from "express";

import {
  createExpense,
  getExpenseById,
  getExpenseSummary,
  getExpenses,
  updateExpense,
} from "./expense.controller.js";

import {
  createExpenseSchema,
  getExpenseByIdSchema,
  getExpensesSchema,
  updateExpenseSchema,
} from "./expense.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer"));

router.post("/", zodValidate(createExpenseSchema), createExpense);

router.get("/", zodValidate(getExpensesSchema), getExpenses);

router.get("/summary", getExpenseSummary);

router.get("/:id", zodValidate(getExpenseByIdSchema), getExpenseById);

router.patch("/:id", zodValidate(updateExpenseSchema), updateExpense);

export default router;