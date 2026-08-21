import { Router } from "express";

import {
  addWalletFunds,
  createWallet,
  deductWalletFunds,
  getWallet,
} from "./wallet.controller.js";

import {
  addWalletFundsSchema,
  createWalletSchema,
  deductWalletFundsSchema,
  getWalletSchema,
} from "./wallet.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";

const router = Router();

router.post("/", zodValidate(createWalletSchema), createWallet);
router.get("/:residentId", zodValidate(getWalletSchema), getWallet);
router.patch("/:residentId/add-funds", zodValidate(addWalletFundsSchema), addWalletFunds);
router.patch("/:residentId/deduct", zodValidate(deductWalletFundsSchema), deductWalletFunds);

export default router;