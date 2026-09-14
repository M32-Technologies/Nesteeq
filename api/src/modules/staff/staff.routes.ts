import express from "express"
import { protect, requireRole } from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  getStaffDetailsHandler,
  getStaffHandler,
  updateStaffDetailsHandler,
  updateStaffStatusHandler,
} from "./staff.controller.js"
import { staffListQuerySchema } from "./staff.validation.js"

const router = express.Router()

router.get(
  "/",
  protect,
  requireRole("property_manager"),
  zodValidate(staffListQuerySchema),
  getStaffHandler,
)
router.patch(
  "/:id/status",
  protect,
  requireRole("property_manager"),
  updateStaffStatusHandler,
)
router.patch(
  "/:id",
  protect,
  requireRole("property_manager"),
  updateStaffDetailsHandler,
)
router.get("/:id", protect, requireRole("property_manager"), getStaffDetailsHandler)

export default router