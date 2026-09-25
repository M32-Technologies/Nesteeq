import { Router, type RequestHandler } from "express";

import {
  getTreasurerDashboard,
  getTreasurerChart,
  getTreasurerSettings,
  updateTreasurerSettings,
  getMaintenancePayouts,
  processMaintenancePayout,
  getDefaultersReport,
  getExpenseBreakdownReport,
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
  getAuthenticatedApartmentId,
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js";

const router = Router();

const useAuthenticatedApartmentParam: RequestHandler = (
  req,
  _res,
  next
) => {
  req.params.apartmentId = getAuthenticatedApartmentId(req);
  next();
};

router.use(protect, requireRole("treasurer", "property_manager"));

router.get(
  "/dashboard",
  useAuthenticatedApartmentParam,
  zodValidate(getTreasurerDashboardSchema),
  getTreasurerDashboard
);

router.get(
  "/chart",
  useAuthenticatedApartmentParam,
  zodValidate(getTreasurerChartSchema),
  getTreasurerChart
);

router.get(
  "/settings",
  useAuthenticatedApartmentParam,
  zodValidate(getTreasurerDashboardSchema),
  getTreasurerSettings
);

router.patch(
  "/settings",
  useAuthenticatedApartmentParam,
  zodValidate(updateTreasurerSettingsSchema),
  updateTreasurerSettings
);

router.get(
  "/maintenance-payouts",
  useAuthenticatedApartmentParam,
  zodValidate(getMaintenancePayoutsSchema),
  getMaintenancePayouts
);

router.post(
  "/maintenance-payouts/:jobId/process",
  useAuthenticatedApartmentParam,
  zodValidate(processMaintenancePayoutSchema),
  processMaintenancePayout
);

router.get(
  "/reports/defaulters",
  useAuthenticatedApartmentParam,
  getDefaultersReport
);

router.get(
  "/reports/expense-breakdown",
  useAuthenticatedApartmentParam,
  getExpenseBreakdownReport
);

export default router;
