import {
  Router,
  type Request,
  type RequestHandler,
} from "express";

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
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { Expense } from "./expense.model.js";

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

const requireBodyApartmentAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  const authenticatedApartmentId =
    getAuthenticatedApartmentId(req);

  if (req.body.apartmentId) {
    ensureApartmentAccess(req, req.body.apartmentId);
  }

  req.body.apartmentId = authenticatedApartmentId;
  next();
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

const requireExpenseApartmentAccess = catchAsync(
  async (req, _res, next) => {
    const expense = await Expense.findById(req.params.id)
      .select("apartmentId")
      .lean();

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    ensureApartmentAccess(req, expense.apartmentId);
    next();
  }
);

router.use(protect, requireRole("treasurer"));

router.post(
  "/",
  requireBodyApartmentAccess,
  zodValidate(createExpenseSchema),
  createExpense
);

router.get(
  "/",
  zodValidate(getExpensesSchema),
  requireQueryApartmentAccess,
  getExpenses
);

router.get(
  "/:id",
  zodValidate(getExpenseByIdSchema),
  requireExpenseApartmentAccess,
  getExpenseById
);

router.patch(
  "/:id",
  zodValidate(updateExpenseSchema),
  requireExpenseApartmentAccess,
  updateExpense
);

export default router;
