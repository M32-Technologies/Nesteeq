import express from "express"

import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import {
  createBlockHandler,
  getBlocksHandler,
  getSingleBlockHandler,
} from "./block.controller.js"
import {
  blockListQuerySchema,
  createBlockSchema,
} from "./block.validation.js"

const router = express.Router()
const managerOnly = requireRole("property_manager")

router.get("/",protect,managerOnly,zodValidate(blockListQuerySchema),getBlocksHandler,)

router.post("/",protect,managerOnly,zodValidate(createBlockSchema),createBlockHandler,)

router.get("/:id", protect, managerOnly, getSingleBlockHandler);

export default router
