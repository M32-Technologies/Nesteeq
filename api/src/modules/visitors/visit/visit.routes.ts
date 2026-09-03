import { Router } from "express"

import {
  checkInVisitor,
  checkoutVisitor,
  createManualVisitorEntry,
  getActiveVisitors,
  getVisitorRecords,
  getVisitorHistory,
} from "./visit.controller.js"

import {
  checkInVisitorSchema,
  listVisitorRecordsQuerySchema,
  listVisitorVisitsQuerySchema,
  manualVisitorEntrySchema,
  visitorVisitIdParamsSchema,
} from "./visit.schema.js"

import {
  protect,
  requireRole,
} from "../../../middlewares/authMiddleware.js"

import { zodValidate } from "../../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)
router.use(requireRole("security_staff"))

router.post("/check-in", zodValidate(checkInVisitorSchema), checkInVisitor)
router.post("/manual", zodValidate(manualVisitorEntrySchema), createManualVisitorEntry)
router.patch("/:visitId/check-out", zodValidate(visitorVisitIdParamsSchema), checkoutVisitor)
router.get("/", zodValidate(listVisitorRecordsQuerySchema), getVisitorRecords)
router.get("/active", zodValidate(listVisitorVisitsQuerySchema), getActiveVisitors)
router.get("/history", zodValidate(listVisitorVisitsQuerySchema), getVisitorHistory)

export default router
