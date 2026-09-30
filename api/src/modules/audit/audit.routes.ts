import { Router } from "express";

import {
  getAuditById,
  getAuditLogs,
} from "./audit.controller.js";
import {
  getAuditByIdSchema,
  getAuditLogsSchema,
} from "./audit.schema.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer"));

router.get("/", zodValidate(getAuditLogsSchema), getAuditLogs);
router.get("/:id", zodValidate(getAuditByIdSchema), getAuditById);

export default router;