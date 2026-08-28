import express from "express";
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

const managementRoles = [
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
const technicianCreatorRoles = [
  "ADMIN",
  "admin",
  "SUPER_ADMIN",
  "super_admin",
  "SUPER ADMIN",
  "PROPERTY_MANAGER",
  "property_manager",
  "PROPERTY MANAGER",
];
const maintenanceRoles = [
  "MAINTENANCE_STAFF",
  "maintenance_staff",
  "MAINTENANCE STAFF",
  "MAINTENANCE_TECHNICIAN",
  "maintenance_technician",
  "MAINTENANCE TECHNICIAN",
  "TECHNICIAN",
  "technician",
];
const technicianAccessRoles = [...managementRoles, ...maintenanceRoles];

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
