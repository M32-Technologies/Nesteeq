import express from "express";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  getComplaintReportHandler,
  getCostReportHandler,
  getMaintenanceReportHandler,
  getPendingWorkReportHandler,
  getReportsOverviewHandler,
  getTechnicianReportHandler,
} from "./report.controller.js";
import { getReportsSchema } from "./report.schema.js";

const router = express.Router();

const reportRoles = [
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
  "/reports",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getReportsOverviewHandler
);

router.get(
  "/reports/complaints",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getComplaintReportHandler
);

router.get(
  "/reports/maintenance",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getMaintenanceReportHandler
);

router.get(
  "/reports/technicians",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getTechnicianReportHandler
);

router.get(
  "/reports/costs",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getCostReportHandler
);

router.get(
  "/reports/pending-work",
  authorize(...reportRoles),
  zodValidate(getReportsSchema),
  getPendingWorkReportHandler
);

export default router;
