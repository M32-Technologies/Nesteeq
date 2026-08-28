import express from "express";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { getFacilityDashboardHandler } from "./facility.controller.js";

const router = express.Router();

const facilityDashboardRoles = [
  "ADMIN",
  "admin",
  "SUPER_ADMIN",
  "super_admin",
  "SUPER ADMIN",
  "PROPERTY_MANAGER",
  "property_manager",
  "PROPERTY MANAGER",
  "FACILITY_MANAGER",
  "facility_manager",
  "FACILITY MANAGER",
];

router.use(protect);

router.get(
  "/facility/dashboard",
  authorize(...facilityDashboardRoles),
  getFacilityDashboardHandler
);

export default router;
