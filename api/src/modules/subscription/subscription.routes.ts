import express from "express"
import { protect } from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  CreateSubscriptionHandler,
  GetCurrentSubscriptionHandler,
  GetSubscriptionPlansHandler,
  VerifySubscriptionPaymentHandler,
} from "./subscription.controller.js"
import { createSubscriptionSchema } from "./subscription.schema.js"

const router = express.Router()

router.get("/subscription-plans", GetSubscriptionPlansHandler)
router.get("/subscriptions/current", protect, GetCurrentSubscriptionHandler)
router.post("/subscriptions", protect, zodValidate(createSubscriptionSchema), CreateSubscriptionHandler)
router.post("/subscriptions/verify", protect, VerifySubscriptionPaymentHandler)

export default router
