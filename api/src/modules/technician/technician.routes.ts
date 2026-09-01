import express from "express";
import {
  MANAGEMENT_ROUTE_ROLES as managementRoles,
  TECHNICIAN_ACCESS_ROUTE_ROLES as technicianAccessRoles,
  TECHNICIAN_CREATOR_ROUTE_ROLES as technicianCreatorRoles,
} from "../../constants/roles.js";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  assignTechnicianWorkHandler,
  createTechnicianHandler,
  deactivateTechnicianHandler,
  getTechnicianByIdHandler,
  getTechniciansHandler,
  getTechnicianTasksHandler,
  updateTechnicianHandler,
  updateTechnicianStatusHandler,
  updateTechnicianTaskStatusHandler,
} from "./technician.controller.js";
import {
  assignTechnicianWorkSchema,
  createTechnicianSchema,
  deleteTechnicianSchema,
  getTechnicianByIdSchema,
  getTechniciansSchema,
  getTechnicianTasksSchema,
  updateTechnicianSchema,
  updateTechnicianStatusSchema,
  updateTechnicianTaskStatusSchema,
} from "./technician.schema.js";

const router = express.Router();

router.use(protect);

router.post(
  "/technicians",
  authorize(...technicianCreatorRoles),
  zodValidate(createTechnicianSchema),
  createTechnicianHandler
);

router.get(
  "/technicians",
  authorize(...managementRoles),
  zodValidate(getTechniciansSchema),
  getTechniciansHandler
);

router.get(
  "/technicians/:id/tasks",
  authorize(...technicianAccessRoles),
  zodValidate(getTechnicianTasksSchema),
  getTechnicianTasksHandler
);

router.patch(
  "/technicians/:id/tasks/status",
  authorize(...technicianAccessRoles),
  zodValidate(updateTechnicianTaskStatusSchema),
  updateTechnicianTaskStatusHandler
);

router.patch(
  "/technicians/:id/assign",
  authorize(...managementRoles),
  zodValidate(assignTechnicianWorkSchema),
  assignTechnicianWorkHandler
);

router.patch(
  "/technicians/:id/status",
  authorize(...managementRoles),
  zodValidate(updateTechnicianStatusSchema),
  updateTechnicianStatusHandler
);

router.get(
  "/technicians/:id",
  authorize(...technicianAccessRoles),
  zodValidate(getTechnicianByIdSchema),
  getTechnicianByIdHandler
);

router.patch(
  "/technicians/:id",
  authorize(...managementRoles),
  zodValidate(updateTechnicianSchema),
  updateTechnicianHandler
);

router.delete(
  "/technicians/:id",
  authorize(...managementRoles),
  zodValidate(deleteTechnicianSchema),
  deactivateTechnicianHandler
);

export default router;
