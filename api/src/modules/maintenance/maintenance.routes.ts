
import express from "express";
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
  zodValidate(createMaintenanceSchema),
  createMaintenanceHandler
);

router.get(
  "/maintenance",
  zodValidate(getMaintenanceSchema),
  getMaintenanceHandler
);

router.get(
  "/maintenance/:id",
  zodValidate(getMaintenanceByIdSchema),
  getMaintenanceByIdHandler
);

router.patch(
  "/maintenance/:id",
  zodValidate(updateMaintenanceSchema),
  updateMaintenanceHandler
);

router.patch(
  "/maintenance/:id/assign",
  zodValidate(assignMaintenanceSchema),
  assignMaintenanceHandler
);

router.patch(
  "/maintenance/:id/status",
  zodValidate(updateMaintenanceStatusSchema),
  updateMaintenanceStatusHandler
);

router.patch(
  "/maintenance/:id/start",
  zodValidate(startMaintenanceSchema),
  startMaintenanceHandler
);

router.patch(
  "/maintenance/:id/progress",
  zodValidate(updateMaintenanceProgressSchema),
  updateMaintenanceProgressHandler
);

router.patch(
  "/maintenance/:id/complete",
  zodValidate(completeMaintenanceSchema),
  completeMaintenanceHandler
);

router.patch(
  "/maintenance/:id/approve",
  zodValidate(approveMaintenanceSchema),
  approveMaintenanceHandler
);

router.patch(
  "/maintenance/:id/reject",
  zodValidate(rejectMaintenanceSchema),
  rejectMaintenanceHandler
);

router.patch(
  "/maintenance/:id/cost/approve",
  zodValidate(approveMaintenanceCostSchema),
  approveMaintenanceCostHandler
);

router.patch(
  "/maintenance/:id/cost/reject",
  zodValidate(rejectMaintenanceCostSchema),
  rejectMaintenanceCostHandler
);

router.patch(
  "/maintenance/:id/cancel",
  zodValidate(cancelMaintenanceSchema),
  cancelMaintenanceHandler
);

router.patch(
  "/maintenance/:id/close",
  zodValidate(closeMaintenanceSchema),
  closeMaintenanceHandler
);

export default router;

