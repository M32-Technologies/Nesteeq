import { Router } from "express"

import {
  assignParkingSlot,
  createParkingSlot,
  listParkingSlots,
  releaseParkingSlot,
  updateParkingSlotStatus,
} from "./parking.controller.js"
import {
  assignParkingSlotSchema,
  createParkingSlotSchema,
  listParkingSlotsSchema,
  parkingSlotIdParamsSchema,
  updateParkingSlotStatusSchema,
} from "./parking.schema.js"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)
router.use(requireRole("security_staff"))

router.get("/", zodValidate(listParkingSlotsSchema), listParkingSlots)
router.post("/", zodValidate(createParkingSlotSchema), createParkingSlot)
router.post("/assign", zodValidate(assignParkingSlotSchema), assignParkingSlot)
router.patch(
  "/:slotId/status",
  zodValidate(updateParkingSlotStatusSchema),
  updateParkingSlotStatus
)
router.patch(
  "/:slotId/release",
  zodValidate(parkingSlotIdParamsSchema),
  releaseParkingSlot
)

export default router
