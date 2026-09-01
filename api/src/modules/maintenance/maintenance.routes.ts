import express from "express";
import {
  MAINTENANCE_ACCESS_ROUTE_ROLES as maintenanceAccessRoles,
  MANAGEMENT_AND_MAINTENANCE_ROUTE_ROLES as managementAndMaintenanceRoles,
  MANAGEMENT_ROUTE_ROLES as managementRoles,
  MAINTENANCE_ROUTE_ROLES as maintenanceRoles,
} from "../../constants/roles.js";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  approveMaintenanceHandler,
  approveMaintenanceCostHandler,
  assignMaintenanceHandler,
  cancelMaintenanceHandler,
  closeMaintenanceHandler,
  completeMaintenanceHandler,
  createMaintenanceHandler,
  getMaintenanceByIdHandler,
  getMaintenanceHandler,
  rejectMaintenanceHandler,
  rejectMaintenanceCostHandler,
  startMaintenanceHandler,
  updateMaintenanceHandler,
  updateMaintenanceProgressHandler,
  updateMaintenanceStatusHandler,
} from "./maintenance.controller.js";
import {
  approveMaintenanceSchema,
  approveMaintenanceCostSchema,
  assignMaintenanceSchema,
  cancelMaintenanceSchema,
  closeMaintenanceSchema,
  completeMaintenanceSchema,
  createMaintenanceSchema,
  getMaintenanceByIdSchema,
  getMaintenanceSchema,
  rejectMaintenanceSchema,
  rejectMaintenanceCostSchema,
  startMaintenanceSchema,
  updateMaintenanceProgressSchema,
  updateMaintenanceSchema,
  updateMaintenanceStatusSchema,
} from "./maintenance.schema.js";

const router = express.Router();

router.use(protect);

router.post(
  "/maintenance",
  authorize(...managementRoles),
  zodValidate(createMaintenanceSchema),
  createMaintenanceHandler
);

router.get(
  "/maintenance",
  authorize(...maintenanceAccessRoles),
  zodValidate(getMaintenanceSchema),
  getMaintenanceHandler
);

router.get(
  "/maintenance/:id",
  authorize(...maintenanceAccessRoles),
  zodValidate(getMaintenanceByIdSchema),
  getMaintenanceByIdHandler
);

router.patch(
  "/maintenance/:id",
  authorize(...managementRoles),
  zodValidate(updateMaintenanceSchema),
  updateMaintenanceHandler
);

router.patch(
  "/maintenance/:id/assign",
  authorize(...managementRoles),
  zodValidate(assignMaintenanceSchema),
  assignMaintenanceHandler
);

router.patch(
  "/maintenance/:id/status",
  authorize(...managementAndMaintenanceRoles),
  zodValidate(updateMaintenanceStatusSchema),
  updateMaintenanceStatusHandler
);

router.patch(
  "/maintenance/:id/start",
  authorize(...managementAndMaintenanceRoles),
  zodValidate(startMaintenanceSchema),
  startMaintenanceHandler
);

router.patch(
  "/maintenance/:id/progress",
  authorize(...managementAndMaintenanceRoles),
  zodValidate(updateMaintenanceProgressSchema),
  updateMaintenanceProgressHandler
);

router.patch(
  "/maintenance/:id/complete",
  authorize(...maintenanceRoles),
  zodValidate(completeMaintenanceSchema),
  completeMaintenanceHandler
);

router.patch(
  "/maintenance/:id/approve",
  authorize(...managementRoles),
  zodValidate(approveMaintenanceSchema),
  approveMaintenanceHandler
);

router.patch(
  "/maintenance/:id/reject",
  authorize(...managementRoles),
  zodValidate(rejectMaintenanceSchema),
  rejectMaintenanceHandler
);

router.patch(
  "/maintenance/:id/cost/approve",
  authorize(...managementRoles),
  zodValidate(approveMaintenanceCostSchema),
  approveMaintenanceCostHandler
);

router.patch(
  "/maintenance/:id/cost/reject",
  authorize(...managementRoles),
  zodValidate(rejectMaintenanceCostSchema),
  rejectMaintenanceCostHandler
);

router.patch(
  "/maintenance/:id/cancel",
  authorize(...managementRoles),
  zodValidate(cancelMaintenanceSchema),
  cancelMaintenanceHandler
);

router.patch(
  "/maintenance/:id/close",
  authorize(...managementRoles),
  zodValidate(closeMaintenanceSchema),
  closeMaintenanceHandler
);

export default router;
