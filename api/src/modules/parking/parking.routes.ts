import { Router } from "express"

import {
  assignParkingSlot,
  assignResidentParkingHandler,
  createParkingSlot,
  generateParkingSlots,
  getParkingSlotByIdHandler,
  getParkingStatsHandler,
  listParkingSlots,
  releaseParkingSlot,
  releaseResidentParkingHandler,
  updateParkingSlot,
  updateParkingSlotStatus,
} from "./parking.controller.js"
import {
  assignParkingSlotSchema,
  assignResidentParkingSchema,
  createParkingSlotSchema,
  generateParkingSlotsSchema,
  listParkingSlotsSchema,
  parkingIdParamsSchema,
  releaseParkingSchema,
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

router.get(
  "/stats",
  requireRole("property_manager", "security_staff"),
  getParkingStatsHandler
)
router.get(
  "/",
  requireRole("property_manager", "security_staff"),
  zodValidate(listParkingSlotsSchema),
  listParkingSlots
)
router.post(
  "/generate",
  requireRole("property_manager", "security_staff"),
  zodValidate(generateParkingSlotsSchema),
  generateParkingSlots
)
router.post(
  "/",
  requireRole("property_manager"),
  zodValidate(createParkingSlotSchema),
  createParkingSlot
)
router.post(
  "/assign",
  requireRole("security_staff"),
  zodValidate(assignParkingSlotSchema),
  assignParkingSlot
)
router.get(
  "/:parkingId",
  requireRole("property_manager"),
  zodValidate(parkingIdParamsSchema),
  getParkingSlotByIdHandler
)
router.patch(
  "/:parkingId/status",
  requireRole("property_manager", "security_staff"),
  zodValidate(updateParkingSlotStatusSchema),
  updateParkingSlotStatus
)
router.patch(
  "/:parkingId",
  requireRole("property_manager"),
  zodValidate(updateParkingSlotSchema),
  updateParkingSlot
)
router.patch(
  "/:parkingId/release",
  requireRole("security_staff"),
  zodValidate(releaseParkingSchema),
  releaseParkingSlot
)
router.post(
  "/:parkingId/assign-resident",
  requireRole("property_manager"),
  zodValidate(assignResidentParkingSchema),
  assignResidentParkingHandler
)
router.post(
  "/:parkingId/release",
  requireRole("property_manager"),
  zodValidate(releaseParkingSchema),
  releaseResidentParkingHandler
)

export default router
