import { Router } from "express"

import {
  createEmergencyAlert,
  listEmergencyAlerts,
  updateEmergencyAlertStatus,
} from "./alert.controller.js"
import {
  createEmergencyAlertSchema,
  listEmergencyAlertsSchema,
  updateEmergencyAlertStatusSchema,
} from "./alert.schema.js"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)

router.get(
  "/",
  requireRole("security_staff"),
  zodValidate(listEmergencyAlertsSchema),
  listEmergencyAlerts
)

router.post(
  "/",
  requireRole("resident", "security_staff"),
  zodValidate(createEmergencyAlertSchema),
  createEmergencyAlert
)

router.patch(
  "/:alertId/status",
  requireRole("security_staff"),
  zodValidate(updateEmergencyAlertStatusSchema),
  updateEmergencyAlertStatus
)

export default router
