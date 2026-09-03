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

// All parking routes require authentication
router.use(protect)

/**
 * Shared parking visibility
 * Property Manager + Security Staff
 */
router.get(
  "/",
  requireRole("property_manager", "security_staff"),
  zodValidate(listParkingSlotsSchema),
  listParkingSlots
)

/**
 * Property Manager
 * Generate the apartment parking structure
 */
router.post(
  "/generate",
  requireRole("property_manager"),
  zodValidate(generateParkingSlotsSchema),
  generateParkingSlots
)

/**
 * Property Manager
 * Edit slot number / notes
 */
router.patch(
  "/:slotId",
  requireRole("property_manager"),
  zodValidate(updateParkingSlotSchema),
  updateParkingSlot
)

/**
 * Property Manager + Security Staff
 *
 * Property Manager:
 * AVAILABLE / RESERVED / OUT_OF_SERVICE
 *
 * Security can continue using the existing
 * operational status functionality if required.
 */
router.patch(
  "/:slotId/status",
  requireRole("property_manager", "security_staff"),
  zodValidate(updateParkingSlotStatusSchema),
  updateParkingSlotStatus
)

/**
 * Security Staff only
 * Create a single visitor parking slot
 */
router.post(
  "/",
  requireRole("security_staff"),
  zodValidate(createParkingSlotSchema),
  createParkingSlot
)

/**
 * Security Staff only
 * Assign a visitor to a parking slot
 */
router.post(
  "/assign",
  requireRole("security_staff"),
  zodValidate(assignParkingSlotSchema),
  assignParkingSlot
)

/**
 * Security Staff only
 * Release an active visitor parking assignment
 */
router.patch(
  "/:slotId/release",
  requireRole("security_staff"),
  zodValidate(parkingSlotIdParamsSchema),
  releaseParkingSlot
)

export default router