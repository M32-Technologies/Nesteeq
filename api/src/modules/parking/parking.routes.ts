import { Router } from "express";

import {
  generateParkingSlotsHandler, getParkingStatsHandler, getParkingSlotsHandler, getParkingSlotByIdHandler, updateParkingSlotHandler,
  assignResidentParkingHandler,
  releaseResidentParkingHandler,
  updateParkingSlotStatusHandler,
} from "./parking.controller.js";
import {
  generateParkingSlotsSchema,
  getParkingSlotsQuerySchema,
  parkingIdParamsSchema,
  updateParkingSlotSchema,
  assignResidentParkingSchema,
  releaseParkingSchema,
  updateParkingSlotStatusSchema,
} from "./parking.validation.js";
import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";

const router = Router();
router.use(protect);

router.get("/stats", requireRole("property_manager", "security_staff"), getParkingStatsHandler);
router.get("/", requireRole("property_manager", "security_staff"), zodValidate(getParkingSlotsQuerySchema), getParkingSlotsHandler);
router.get("/:parkingId", requireRole("property_manager"), zodValidate(parkingIdParamsSchema), getParkingSlotByIdHandler);
router.post("/generate", requireRole("property_manager", "security_staff"), zodValidate(generateParkingSlotsSchema), generateParkingSlotsHandler);
router.patch("/:parkingId/status", requireRole("property_manager"), zodValidate(updateParkingSlotStatusSchema), updateParkingSlotStatusHandler);
router.patch("/:parkingId", requireRole("property_manager"), zodValidate(updateParkingSlotSchema), updateParkingSlotHandler);
router.post("/:parkingId/assign-resident", requireRole("property_manager"), zodValidate(assignResidentParkingSchema), assignResidentParkingHandler);
router.post("/:parkingId/release", requireRole("property_manager"), zodValidate(releaseParkingSchema), releaseResidentParkingHandler);

export default router;