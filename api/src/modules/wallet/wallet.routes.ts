import { Router } from "express";

import {
  addWalletFunds,
  createWallet,
  deductWalletFunds,
  getWallet,
  getWallets,
  getWalletSummary,
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
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer"));

router.post("/", zodValidate(createWalletSchema), createWallet);

router.get("/", zodValidate(getWalletsSchema), getWallets);

router.get("/summary", getWalletSummary);

router.get("/:residentId", zodValidate(getWalletSchema), getWallet);

router.patch("/:residentId/add-funds", zodValidate(addWalletFundsSchema), addWalletFunds);

router.patch("/:residentId/deduct", zodValidate(deductWalletFundsSchema), deductWalletFunds);

export default router;