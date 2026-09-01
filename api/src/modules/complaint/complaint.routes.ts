import express from "express";
import {
  COMPLAINT_ACCESS_ROUTE_ROLES as complaintAccessRoles,
  MANAGEMENT_AND_MAINTENANCE_ROUTE_ROLES as managementAndMaintenanceRoles,
  MANAGEMENT_ROUTE_ROLES as managementRoles,
  RESIDENT_AND_MANAGEMENT_ROUTE_ROLES as residentAndManagementRoles,
  RESIDENT_ROUTE_ROLES as residentRoles,
  MAINTENANCE_ROUTE_ROLES as maintenanceRoles,
} from "../../constants/roles.js";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  approveComplaintHandler,
  assignComplaintHandler,
  cancelComplaintHandler,
  completeComplaintWorkHandler,
  confirmComplaintResolutionHandler,
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
  confirmComplaintResolutionSchema,
  createComplaintSchema,
  getComplaintByIdSchema,
  getComplaintsSchema,
  rejectComplaintSchema,
  updateComplaintSchema,
  updateComplaintStatusSchema,
} from "./compliaint.schema.js";

const router = express.Router();

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

router.patch(
  "/complaints/:id/confirm-resolution",
  authorize(...residentRoles),
  zodValidate(confirmComplaintResolutionSchema),
  confirmComplaintResolutionHandler
);

export default router;
