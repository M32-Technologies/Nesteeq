import { Router } from "express";

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

const router = Router();

router.post("/", zodValidate(createBillSchema), createBill);

router.get("/", zodValidate(getBillsSchema), getBills);

router.get(
  "/summary/:apartmentId",
  zodValidate(getBillingSummarySchema),
  getBillingSummary
);

router.get("/:id", zodValidate(getBillByIdSchema), getBillById);

router.patch("/:id", zodValidate(updateBillSchema), updateBill);

router.patch(
  "/:id/payment",
  zodValidate(recordBillPaymentSchema),
  recordBillPayment
);

router.patch(
  "/:id/waive-late-fee",
  zodValidate(waiveLateFeeSchema),
  waiveLateFee
);

export default router;
