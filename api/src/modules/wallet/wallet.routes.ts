import {
  Router,
  type Request,
  type RequestHandler,
} from "express";

import {
  addWalletFunds,
  createWallet,
  deductWalletFunds,
  getWallet,
  getWallets,
} from "./wallet.controller.js";

import {
  addWalletFundsSchema,
  createWalletSchema,
  deductWalletFundsSchema,
  getWalletSchema,
  getWalletsSchema,
} from "./wallet.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { Billing } from "../billing/billing.model.js";
import { Wallet } from "./wallet.model.js";

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

const requireWalletApartmentAccess = catchAsync(
  async (req, _res, next) => {
    const apartmentId = getAuthenticatedApartmentId(req);
    const wallet = await Wallet.findOne({
      apartmentId,
      residentId: req.params.residentId,
    })
      .select("apartmentId")
      .lean();

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    ensureApartmentAccess(req, wallet.apartmentId);
    next();
  }
);

const requireBillApartmentAccess = catchAsync(
  async (req, _res, next) => {
    const bill = await Billing.findById(req.body.billId)
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
  zodValidate(createWalletSchema),
  createWallet
);

router.get(
  "/",
  requireQueryApartmentAccess,
  zodValidate(getWalletsSchema),
  getWallets
);

router.get(
  "/:residentId",
  requireQueryApartmentAccess,
  zodValidate(getWalletSchema),
  requireWalletApartmentAccess,
  getWallet
);

router.patch(
  "/:residentId/add-funds",
  requireBodyApartmentAccess,
  zodValidate(addWalletFundsSchema),
  addWalletFunds
);

router.patch(
  "/:residentId/deduct",
  requireBodyApartmentAccess,
  zodValidate(deductWalletFundsSchema),
  requireWalletApartmentAccess,
  requireBillApartmentAccess,
  deductWalletFunds
);

export default router;