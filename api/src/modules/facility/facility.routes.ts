import express from "express";
import { FACILITY_DASHBOARD_ROUTE_ROLES as facilityDashboardRoles } from "../../constants/roles.js";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { getFacilityDashboardHandler } from "./facility.controller.js";

const router = express.Router();

router.use(protect);

router.get(
  "/facility/dashboard",
  authorize(...facilityDashboardRoles),
  getFacilityDashboardHandler
);

export default router;
