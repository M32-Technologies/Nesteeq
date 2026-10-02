import { Router } from "express";

import { getPayments, reversePayment } from "./payment.controller.js";
import { getPaymentsSchema, reversePaymentSchema } from "./payment.schema.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer", "property_manager"));

router.get("/", zodValidate(getPaymentsSchema), getPayments);
router.post("/:id/reverse", zodValidate(reversePaymentSchema), reversePayment);

export default router;
