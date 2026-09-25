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
router.get("/dashboard/feed", protect, requireRole("resident", "owner", "tenant", "property_manager"), getResidentDashboardFeedHandler);
router.get("/me/parking-info", protect, requireRole("resident", "owner", "tenant", "property_manager"), getMyVehiclesAndParkingHandler);
router.post("/vehicles", protect, requireRole("resident", "owner", "tenant", "property_manager"), zodValidate(registerVehicleSchema), registerVehicleHandler);
router.delete("/vehicles/:vehicleId", protect, requireRole("resident", "owner", "tenant", "property_manager"), zodValidate(vehicleIdParamsSchema), deleteVehicleHandler);

router.post("/passes", protect, requireRole("resident", "owner", "tenant", "property_manager"), zodValidate(createResidentGuestPassSchema), createResidentGuestPassHandler);
router.get("/passes", protect, requireRole("resident", "owner", "tenant", "property_manager"), zodValidate(listResidentGuestPassesQuerySchema), getResidentGuestPassesHandler);
router.patch("/passes/:passId/cancel", protect, requireRole("resident", "owner", "tenant", "property_manager"), zodValidate(residentGuestPassParamsSchema), cancelResidentGuestPassHandler);

router.get("/", protect, requireRole("property_manager"), zodValidate(residentListQuerySchema), getResidentHandler);

router.get("/stats", protect, requireRole("property_manager"), getResidentStatsHandler);

router.patch("/:id/status", protect, requireRole("property_manager"), updateResidentStatusHandler);

router.patch("/:id", protect, requireRole("property_manager"), updateResidentDetailsHandler);

router.get("/:id", protect, requireRole("property_manager"), getResidentDetailsHandler);

export default router;
