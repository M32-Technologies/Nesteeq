import express from "express"

import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import {
  createBlockHandler,
  updateBlockStatusHandler,
  getBlocksHandler,
  getSingleBlockHandler,
  updateBlockHandler,
} from "./block.controller.js"
import {
  blockListQuerySchema,
  createBlockSchema,
  updateBlockSchema,
  updateBlockStatusSchema,
} from "./block.validation.js"

const router = express.Router()
const managerOnly = requireRole("property_manager")

router.get("/",protect,managerOnly,zodValidate(blockListQuerySchema),getBlocksHandler,)

router.post("/",protect,managerOnly,zodValidate(createBlockSchema),createBlockHandler,)

router.get("/:id", protect, managerOnly, getSingleBlockHandler);

router.patch("/:id", protect, managerOnly, zodValidate(updateBlockSchema), updateBlockHandler);

router.patch("/:id/status", protect, managerOnly, zodValidate(updateBlockStatusSchema), updateBlockStatusHandler);

export default router
