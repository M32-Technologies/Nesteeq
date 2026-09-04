import express from "express";
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
  zodValidate(createComplaintSchema),
  createComplaintHandler
);

router.get(
  "/complaints",
  zodValidate(getComplaintsSchema),
  getComplaintsHandler
);

router.get(
  "/complaints/:id",
  zodValidate(getComplaintByIdSchema),
  getComplaintByIdHandler
);

router.patch(
  "/complaints/:id",
  zodValidate(updateComplaintSchema),
  updateComplaintHandler
);

router.patch(
  "/complaints/:id/assign",
  zodValidate(assignComplaintSchema),
  assignComplaintHandler
);

router.patch(
  "/complaints/:id/status",
  zodValidate(updateComplaintStatusSchema),
  updateComplaintStatusHandler
);

router.patch(
  "/complaints/:id/complete",
  zodValidate(completeComplaintWorkSchema),
  completeComplaintWorkHandler
);

router.patch(
  "/complaints/:id/approve",
  zodValidate(approveComplaintSchema),
  approveComplaintHandler
);

router.patch(
  "/complaints/:id/reject",
  zodValidate(rejectComplaintSchema),
  rejectComplaintHandler
);

router.patch(
  "/complaints/:id/cancel",
  zodValidate(cancelComplaintSchema),
  cancelComplaintHandler
);

router.patch(
  "/complaints/:id/confirm-resolution",
  zodValidate(confirmComplaintResolutionSchema),
  confirmComplaintResolutionHandler
);

export default router;
