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
  createResidentGuestPassHandler,
  getResidentGuestPassesHandler,
  cancelResidentGuestPassHandler,
  markVisitorDepartedHandler,
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
  createResidentGuestPassSchema,
  listResidentGuestPassesQuerySchema,
  residentGuestPassParamsSchema,
} from "./visit.validation.js"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"

import { zodValidate } from "../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)

router.post("/passes", zodValidate(createResidentGuestPassSchema), createResidentGuestPassHandler)
router.get("/passes", zodValidate(listResidentGuestPassesQuerySchema), getResidentGuestPassesHandler)
router.get("/passes/:guestPassId", zodValidate(guestPassIdParamsSchema), getGuestPassById)
router.patch("/passes/:passId/cancel", zodValidate(residentGuestPassParamsSchema), cancelResidentGuestPassHandler)
router.patch("/passes/:passId/depart-flat", zodValidate(residentGuestPassParamsSchema), markVisitorDepartedHandler)
router.patch("/visits/:visitId/depart-flat", zodValidate(visitorVisitIdParamsSchema), markVisitorDepartedHandler)
router.post("/visits/check-in", requireRole("security_staff"), zodValidate(checkInVisitorSchema), checkInVisitor)
router.post("/visits/manual", requireRole("security_staff"), zodValidate(manualVisitorEntrySchema), createManualVisitorEntry)
router.patch("/visits/:visitId/check-out", requireRole("security_staff", "property_manager"), zodValidate(visitorVisitIdParamsSchema), checkoutVisitor)
router.get("/visits", requireRole("security_staff", "property_manager"), zodValidate(listVisitorRecordsQuerySchema), getVisitorRecords)
router.get("/visits/active", requireRole("security_staff", "property_manager"), zodValidate(listVisitorVisitsQuerySchema), getActiveVisitors)
router.get("/visits/history", requireRole("security_staff", "property_manager"), zodValidate(listVisitorVisitsQuerySchema), getVisitorHistory)

export default router
