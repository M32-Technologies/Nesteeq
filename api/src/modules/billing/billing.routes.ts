import {
  Router,
  type Request,
  type RequestHandler,
} from "express";

import {
  createBill,
  getBillById,
  getBillingSummary,
  getBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
} from "./billing.controller.js";

import {
  createBillSchema,
  getBillByIdSchema,
  getBillingSummarySchema,
  getBillsSchema,
  recordBillPaymentSchema,
  updateBillSchema,
  waiveLateFeeSchema,
} from "./billing.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { Billing } from "./billing.model.js";

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

const requireParamApartmentAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  ensureApartmentAccess(req, req.params.apartmentId);
  next();
};

const requireBillApartmentAccess = catchAsync(
  async (req, _res, next) => {
    const bill = await Billing.findById(req.params.id)
      .select("apartmentId")
      .lean();

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    ensureApartmentAccess(req, bill.apartmentId);
    next();
  }
);

router.use(protect, requireRole("treasurer"));

router.post(
  "/",
  requireBodyApartmentAccess,
  zodValidate(createBillSchema),
  createBill
);

router.get(
  "/",
  zodValidate(getBillsSchema),
  requireQueryApartmentAccess,
  getBills
);

router.get(
  "/summary/:apartmentId",
  zodValidate(getBillingSummarySchema),
  requireParamApartmentAccess,
  getBillingSummary
);

router.get(
  "/:id",
  zodValidate(getBillByIdSchema),
  requireBillApartmentAccess,
  getBillById
);

router.patch(
  "/:id",
  zodValidate(updateBillSchema),
  requireBillApartmentAccess,
  updateBill
);

router.patch(
  "/:id/payment",
  zodValidate(recordBillPaymentSchema),
  requireBillApartmentAccess,
  recordBillPayment
);

router.patch(
  "/:id/waive-late-fee",
  zodValidate(waiveLateFeeSchema),
  requireBillApartmentAccess,
  waiveLateFee
);

export default router;