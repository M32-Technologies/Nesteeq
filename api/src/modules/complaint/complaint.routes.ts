import express from "express";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  approveComplaintHandler,
  assignComplaintHandler,
  cancelComplaintHandler,
  completeComplaintWorkHandler,
  createComplaintHandler,
  getComplaintByIdHandler,
  getComplaintsHandler,
  rejectComplaintHandler,
  updateComplaintHandler,
  updateComplaintStatusHandler,
} from "./complaint.controller.js";
import {
  approveComplaintSchema,
  assignComplaintSchema,
  cancelComplaintSchema,
  completeComplaintWorkSchema,
  createComplaintSchema,
  getComplaintByIdSchema,
  getComplaintsSchema,
  rejectComplaintSchema,
  updateComplaintSchema,
  updateComplaintStatusSchema,
} from "./compliaint.schema.js";

const router = express.Router();

const residentRoles = ["RESIDENT", "resident", "OWNER", "owner", "TENANT", "tenant"];
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
const complaintAccessRoles = [...residentRoles, ...managementRoles, ...maintenanceRoles];
const residentAndManagementRoles = [...residentRoles, ...managementRoles];
const managementAndMaintenanceRoles = [...managementRoles, ...maintenanceRoles];

router.use(protect);

router.post(
  "/complaints",
  authorize(...residentRoles),
  zodValidate(createComplaintSchema),
  createComplaintHandler
);

router.get(
  "/complaints",
  authorize(...complaintAccessRoles),
  zodValidate(getComplaintsSchema),
  getComplaintsHandler
);

router.get(
  "/complaints/:id",
  authorize(...complaintAccessRoles),
  zodValidate(getComplaintByIdSchema),
  getComplaintByIdHandler
);

router.patch(
  "/complaints/:id",
  authorize(...residentAndManagementRoles),
  zodValidate(updateComplaintSchema),
  updateComplaintHandler
);

router.patch(
  "/complaints/:id/assign",
  authorize(...managementRoles),
  zodValidate(assignComplaintSchema),
  assignComplaintHandler
);

router.patch(
  "/complaints/:id/status",
  authorize(...managementAndMaintenanceRoles),
  zodValidate(updateComplaintStatusSchema),
  updateComplaintStatusHandler
);

router.patch(
  "/complaints/:id/complete",
  authorize(...maintenanceRoles),
  zodValidate(completeComplaintWorkSchema),
  completeComplaintWorkHandler
);

router.patch(
  "/complaints/:id/approve",
  authorize(...managementRoles),
  zodValidate(approveComplaintSchema),
  approveComplaintHandler
);

router.patch(
  "/complaints/:id/reject",
  authorize(...managementRoles),
  zodValidate(rejectComplaintSchema),
  rejectComplaintHandler
);

router.patch(
  "/complaints/:id/cancel",
  authorize(...residentAndManagementRoles),
  zodValidate(cancelComplaintSchema),
  cancelComplaintHandler
);

export default router;
