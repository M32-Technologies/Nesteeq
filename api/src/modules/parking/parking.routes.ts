import { Router } from "express"

import {
  assignParkingSlot,
  createParkingSlot,
  generateParkingSlots,
  listParkingSlots,
  releaseParkingSlot,
  updateParkingSlot,
  updateParkingSlotStatus,
} from "./parking.controller.js"

import {
  assignParkingSlotSchema,
  createParkingSlotSchema,
  generateParkingSlotsSchema,
  listParkingSlotsSchema,
  parkingSlotIdParamsSchema,
  updateParkingSlotSchema,
  updateParkingSlotStatusSchema,
} from "./parking.schema.js"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"

import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)

router.get("/", requireRole("property_manager", "security_staff"), zodValidate(listParkingSlotsSchema), listParkingSlots)
router.post("/generate", requireRole("property_manager"), zodValidate(generateParkingSlotsSchema), generateParkingSlots)
router.post("/", requireRole("property_manager"), zodValidate(createParkingSlotSchema), createParkingSlot)
router.patch("/:slotId", requireRole("property_manager"), zodValidate(updateParkingSlotSchema), updateParkingSlot)
router.patch("/:slotId/status", requireRole("property_manager"), zodValidate(updateParkingSlotStatusSchema), updateParkingSlotStatus)
router.post("/assign", requireRole("security_staff"), zodValidate(assignParkingSlotSchema), assignParkingSlot)
router.patch("/:slotId/release", requireRole("security_staff"), zodValidate(parkingSlotIdParamsSchema), releaseParkingSlot)

export default router
