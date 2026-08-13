import { Router } from "express";

import {
  createSubscription,
  verifySubscriptionPayment,
  getApartmentSubscription,
} from "./subscription.controller.js";

import {
  createSubscriptionSchema,
  verifySubscriptionPaymentSchema,
} from "./subscription.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";

const router = Router();

router.post("/", zodValidate(createSubscriptionSchema), createSubscription);

router.post("/verify-payment", zodValidate(verifySubscriptionPaymentSchema), verifySubscriptionPayment);

router.get("/apartment/:apartmentId", getApartmentSubscription);

export default router;