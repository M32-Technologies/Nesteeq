import express from "express"
import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  getResidentDetailsHandler,
  getResidentHandler,
  getResidentStatsHandler,
  updateResidentDetailsHandler,
  updateResidentStatusHandler,
  getMyVehiclesAndParkingHandler,
  registerVehicleHandler,
  deleteVehicleHandler,
  createResidentGuestPassHandler,
  getResidentGuestPassesHandler,
  cancelResidentGuestPassHandler,
  getCurrentResidentProfileHandler,
  getResidentDashboardFeedHandler,
} from "./resident.controller.js";
import {
  residentListQuerySchema,
  registerVehicleSchema,
  vehicleIdParamsSchema,
  createResidentGuestPassSchema,
  residentGuestPassParamsSchema,
  listResidentGuestPassesQuerySchema,
} from "./resident.validation.js";

const router = express.Router();

router.get("/me", protect, getCurrentResidentProfileHandler);
router.get("/dashboard/feed", protect, getResidentDashboardFeedHandler);
router.get("/me/parking-info", protect, getMyVehiclesAndParkingHandler);
router.post("/vehicles", protect, zodValidate(registerVehicleSchema), registerVehicleHandler);
router.delete("/vehicles/:vehicleId", protect, zodValidate(vehicleIdParamsSchema), deleteVehicleHandler);

router.post("/passes", protect, zodValidate(createResidentGuestPassSchema), createResidentGuestPassHandler);
router.get("/passes", protect, zodValidate(listResidentGuestPassesQuerySchema), getResidentGuestPassesHandler);
router.patch("/passes/:passId/cancel", protect, zodValidate(residentGuestPassParamsSchema), cancelResidentGuestPassHandler);

router.get("/", protect, requireRole("property_manager"), zodValidate(residentListQuerySchema), getResidentHandler);

router.get("/stats", protect, requireRole("property_manager"), getResidentStatsHandler);

router.patch("/:id/status", protect, requireRole("property_manager"), updateResidentStatusHandler);

router.patch("/:id", protect, requireRole("property_manager"), updateResidentDetailsHandler);

router.get("/:id", protect, requireRole("property_manager"), getResidentDetailsHandler);

export default router;
