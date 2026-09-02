import express from "express";
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

router.use(protect);

router.get(
  "/reports",
  zodValidate(getReportsSchema),
  getReportsOverviewHandler
);

router.get(
  "/reports/complaints",
  zodValidate(getReportsSchema),
  getComplaintReportHandler
);

router.get(
  "/reports/maintenance",
  zodValidate(getReportsSchema),
  getMaintenanceReportHandler
);

router.get(
  "/reports/technicians",
  zodValidate(getReportsSchema),
  getTechnicianReportHandler
);

router.get(
  "/reports/costs",
  zodValidate(getReportsSchema),
  getCostReportHandler
);

router.get(
  "/reports/pending-work",
  zodValidate(getReportsSchema),
  getPendingWorkReportHandler
);

export default router;
