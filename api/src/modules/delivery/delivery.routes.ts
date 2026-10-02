import { Router } from "express"

import {
  createDelivery,
  getDeliveryAnalytics,
  getDeliveryById,
  listDeliveries,
  updateDeliveryStatus,
} from "./delivery.controller.js"
import {
  createDeliverySchema,
  deliveryAnalyticsQuerySchema,
  listDeliveriesSchema,
  updateDeliveryStatusSchema,
} from "./delivery.schema.js"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)

router.get(
  "/analytics",
  requireRole("property_manager", "security_staff"),
  zodValidate(deliveryAnalyticsQuerySchema),
  getDeliveryAnalytics
)

router.get(
  "/",
  requireRole("property_manager", "security_staff"),
  zodValidate(listDeliveriesSchema),
  listDeliveries
)

router.get(
  "/:deliveryId",
  requireRole("property_manager", "security_staff"),
  getDeliveryById
)

router.post(
  "/",
  requireRole("security_staff"),
  zodValidate(createDeliverySchema),
  createDelivery
)

router.patch(
  "/:deliveryId/status",
  requireRole("security_staff"),
  zodValidate(updateDeliveryStatusSchema),
  updateDeliveryStatus
)

export default router

