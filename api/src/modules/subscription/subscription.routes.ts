import express from "express"
import { protect, requireRole } from "../../middlewares/authMiddleware.js"
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
router.get(
  "/subscriptions/current",
  protect,
  requireRole("property_manager", "admin", "super_admin"),
  GetCurrentSubscriptionHandler
)
router.post(
  "/subscriptions",
  protect,
  requireRole("property_manager", "admin", "super_admin"),
  zodValidate(createSubscriptionSchema),
  CreateSubscriptionHandler
)
router.post(
  "/subscriptions/verify",
  protect,
  requireRole("property_manager", "admin", "super_admin"),
  VerifySubscriptionPaymentHandler
)

export default router
