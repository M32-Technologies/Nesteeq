import { Router } from "express";

import {
  getTreasurerDashboard,
  getTreasurerChart,
  getTreasurerSettings,
  updateTreasurerSettings,
  getMaintenancePayouts,
  processMaintenancePayout,
  getDefaultersReport,
  getExpenseBreakdownReport,
  exportTreasurerReportCsv,
} from "./treasurer.controller.js";
import {
  getTreasurerDashboardSchema,
  getTreasurerChartSchema,
  updateTreasurerSettingsSchema,
  getMaintenancePayoutsSchema,
  processMaintenancePayoutSchema,
} from "./treasurer.validation.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, requireRole("treasurer", "property_manager"));

router.get(
  "/dashboard",
  zodValidate(getTreasurerDashboardSchema),
  getTreasurerDashboard
);

router.get(
  "/chart",
  zodValidate(getTreasurerChartSchema),
  getTreasurerChart
);

router.get(
  "/settings",
  zodValidate(getTreasurerDashboardSchema),
  getTreasurerSettings
);

router.patch(
  "/settings",
  zodValidate(updateTreasurerSettingsSchema),
  updateTreasurerSettings
);

router.get(
  "/maintenance-payouts",
  zodValidate(getMaintenancePayoutsSchema),
  getMaintenancePayouts
);

router.post(
  "/maintenance-payouts/:jobId/process",
  zodValidate(processMaintenancePayoutSchema),
  processMaintenancePayout
);

router.get(
  "/reports/defaulters",
  getDefaultersReport
);

router.get(
  "/reports/expense-breakdown",
  getExpenseBreakdownReport
);

router.get(
  "/reports/export-csv",
  exportTreasurerReportCsv
);

export default router;
