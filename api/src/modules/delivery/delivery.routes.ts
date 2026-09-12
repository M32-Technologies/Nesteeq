import { Router } from "express"

import {
  createDelivery,
  listDeliveries,
  updateDeliveryStatus,
} from "./delivery.controller.js"
import {
  createDeliverySchema,
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
router.use(requireRole("security_staff"))

router.get("/", zodValidate(listDeliveriesSchema), listDeliveries)
router.post("/", zodValidate(createDeliverySchema), createDelivery)
router.patch(
  "/:deliveryId/status",
  zodValidate(updateDeliveryStatusSchema),
  updateDeliveryStatus
)

export default router
