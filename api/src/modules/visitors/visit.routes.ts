import { Router } from "express"

import {
  cancelGuestPass,
  checkInVisitor,
  checkoutVisitor,
  createGuestPass,
  createManualVisitorEntry,
  getActiveVisitors,
  getGuestPassById,
  getGuestPasses,
  getVisitorRecords,
  getVisitorHistory,
} from "./visit.controller.js"

import {
  checkInVisitorSchema,
  createGuestPassSchema,
  guestPassIdParamsSchema,
  listVisitorRecordsQuerySchema,
  listVisitorVisitsQuerySchema,
  listGuestPassQuerySchema,
  manualVisitorEntrySchema,
  visitorVisitIdParamsSchema,
} from "./visit.validation.js"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"

import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)

router.post("/passes", requireRole("resident"), zodValidate(createGuestPassSchema), createGuestPass)
router.get("/passes", requireRole("resident"), zodValidate(listGuestPassQuerySchema), getGuestPasses)
router.get("/passes/:guestPassId", requireRole("resident"), zodValidate(guestPassIdParamsSchema), getGuestPassById)
router.patch("/passes/:guestPassId/cancel", requireRole("resident"), zodValidate(guestPassIdParamsSchema), cancelGuestPass)
router.post("/visits/check-in", requireRole("security_staff"), zodValidate(checkInVisitorSchema), checkInVisitor)
router.post("/visits/manual", requireRole("security_staff"), zodValidate(manualVisitorEntrySchema), createManualVisitorEntry)
router.patch("/visits/:visitId/check-out", requireRole("security_staff"), zodValidate(visitorVisitIdParamsSchema), checkoutVisitor)
router.get("/visits", requireRole("security_staff"), zodValidate(listVisitorRecordsQuerySchema), getVisitorRecords)
router.get("/visits/active", requireRole("security_staff"), zodValidate(listVisitorVisitsQuerySchema), getActiveVisitors)
router.get("/visits/history", requireRole("security_staff"), zodValidate(listVisitorVisitsQuerySchema), getVisitorHistory)

export default router
