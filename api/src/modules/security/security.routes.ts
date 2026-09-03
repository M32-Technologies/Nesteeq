import { Router } from "express"

import {
  getSecurityActivity,
  getSecurityFlats,
  getSecurityResidents,
  getSecuritySummary,
  verifyGuestPass,
} from "./security.controller.js"
import {
  listSecurityDirectorySchema,
  securityActivityQuerySchema,
  verifyGuestPassSchema,
} from "./security.schema.js"
import { verifyPassRateLimit } from "./verify-pass-rate-limit.js"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"

import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)
router.use(requireRole("security_staff"))

router.get("/summary", getSecuritySummary)
router.get(
  "/activity",
  zodValidate(securityActivityQuerySchema),
  getSecurityActivity
)
router.get("/flats", getSecurityFlats)
router.get(
  "/residents",
  zodValidate(listSecurityDirectorySchema),
  getSecurityResidents
)
router.post(
  "/verify-pass",
  verifyPassRateLimit,
  zodValidate(verifyGuestPassSchema),
  verifyGuestPass
)

export default router
