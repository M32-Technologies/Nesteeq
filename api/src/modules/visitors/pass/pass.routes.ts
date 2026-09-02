import { Router } from "express"

import {
  createGuestPass,
  getGuestPasses,
  getGuestPassById,
  cancelGuestPass,
} from "./pass.controller.js"

import {
  createGuestPassSchema,
  guestPassIdParamsSchema,
  listGuestPassQuerySchema,
} from "./pass.schema.js"

import {
  protect,
  requireRole,
} from "../../../middlewares/authMiddleware.js"

import { zodValidate } from "../../../middlewares/zodValidate.js"

const router = Router()

router.use(protect)
router.use(requireRole("resident"))

router.post("/", zodValidate(createGuestPassSchema), createGuestPass)
router.get("/", zodValidate(listGuestPassQuerySchema), getGuestPasses)
router.get("/:guestPassId", zodValidate(guestPassIdParamsSchema), getGuestPassById)
router.patch("/:guestPassId/cancel", zodValidate(guestPassIdParamsSchema), cancelGuestPass)

export default router
