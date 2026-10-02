import { Router } from "express";

import {
  createBill,
  createCommonBill,
  deleteBill,
  getBillById,
  getBillRecipients,
  getBillingSummary,
  getBills,
  getCommonBills,
  getMyResidentBills,
  payResidentBill,
  payAllResidentBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
} from "./billing.controller.js";

import {
  createBillSchema,
  createCommonBillSchema,
  getBillByIdSchema,
  getBillingSummarySchema,
  getBillsSchema,
  getCommonBillsSchema,
  recordBillPaymentSchema,
  updateBillSchema,
  waiveLateFeeSchema,
  payResidentBillSchema,
  payAllResidentBillsSchema,
} from "./billing.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/my-bills", getMyResidentBills);
router.post("/pay-all", zodValidate(payAllResidentBillsSchema), payAllResidentBills);
router.post("/:id/pay", zodValidate(payResidentBillSchema), payResidentBill);

router.get("/", requireRole("treasurer", "property_manager"), zodValidate(getBillsSchema), getBills);

router.get("/recipients", requireRole("treasurer", "property_manager"), getBillRecipients);

router.get("/summary", requireRole("treasurer", "property_manager"), getBillingSummary);
router.get("/summary/:apartmentId", requireRole("treasurer", "property_manager"), zodValidate(getBillingSummarySchema), getBillingSummary);

router.get("/:id", requireRole("treasurer", "property_manager"), zodValidate(getBillByIdSchema), getBillById);

router.post("/", requireRole("treasurer"), zodValidate(createBillSchema), createBill);
router.post("/common", requireRole("treasurer"), zodValidate(createCommonBillSchema), createCommonBill);
router.get("/common", requireRole("treasurer", "property_manager"), zodValidate(getCommonBillsSchema), getCommonBills);

router.patch("/:id", requireRole("treasurer"), zodValidate(updateBillSchema), updateBill);

router.patch("/:id/payment", requireRole("treasurer"), zodValidate(recordBillPaymentSchema), recordBillPayment);

router.patch("/:id/waive-late-fee", requireRole("treasurer"), zodValidate(waiveLateFeeSchema), waiveLateFee);

router.delete("/:id", requireRole("treasurer"), deleteBill);

export default router;