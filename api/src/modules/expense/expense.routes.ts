import { Router } from "express";

import {
  createExpense,
  getExpenseById,
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

const router = Router();

router.post("/", zodValidate(createExpenseSchema), createExpense);
router.get("/", zodValidate(getExpensesSchema), getExpenses);
router.get("/:id", zodValidate(getExpenseByIdSchema), getExpenseById);
router.patch("/:id", zodValidate(updateExpenseSchema), updateExpense);

export default router;