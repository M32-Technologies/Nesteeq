import { Router } from "express";

import {
  createCheckoutOrder,
  createPaymentOrder,
  verifyCheckoutPayment,
} from "./payment.controller.js";

import {
  createCheckoutOrderSchema,
  createPaymentOrderSchema,
  verifyCheckoutPaymentSchema,
} from "./payment.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";

const router = Router();

router.post("/", zodValidate(createPaymentOrderSchema), createPaymentOrder);

router.post("/checkout-order", zodValidate(createCheckoutOrderSchema), createCheckoutOrder);

router.post("/verify-checkout", zodValidate(verifyCheckoutPaymentSchema), verifyCheckoutPayment);

export default router;