import express from "express"
import { protect } from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  CreateSubscriptionHandler,
  CreateSubscriptionPlanHandler,
  GetSubscriptionPlansHandler,
  VerifySubscriptionPaymentHandler,
} from "./subscription.controller.js"
import { createSubscriptionSchema, subscriptionPlanSchema } from "./subscription.schema.js"

const router = express.Router()

router.get("/subscription-plans", GetSubscriptionPlansHandler)
router.post("/subscription-plans", zodValidate(subscriptionPlanSchema), CreateSubscriptionPlanHandler)
router.post("/subscriptions", protect, zodValidate(createSubscriptionSchema), CreateSubscriptionHandler)
router.post("/subscriptions/verify", protect, VerifySubscriptionPaymentHandler)

export default router
