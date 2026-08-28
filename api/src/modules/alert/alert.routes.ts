import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  getAlertsHandler,
  markAlertReadHandler,
} from "./alert.controller.js";
import {
  getAlertsSchema,
  markAlertReadSchema,
} from "./alert.schema.js";

const router = express.Router();

router.use(protect);

router.get("/alerts", zodValidate(getAlertsSchema), getAlertsHandler);
router.patch("/alerts/:id/read", zodValidate(markAlertReadSchema), markAlertReadHandler);

export default router;
