import { Router } from "express"

import { protect, requireRole } from "../../middlewares/authMiddleware.js"
import { uploadEvidenceMiddleware } from "../../middlewares/uploadMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  addProgressUpdateController,
  completeJobController,
  getAssignedJobsController,
  getDashboardStatsController,
  getJobByIdController,
  startJobController,
  submitCostController,
  uploadEvidenceController,
} from "./maintenance-technician.controller.js"
import {
  completeWorkSchema,
  costSubmissionSchema,
  progressUpdateSchema,
} from "./maintenance-technician.validation.js"

const router = Router()

router.use(protect)
router.use(requireRole("maintenance_technician", "technician", "maintenance_staff"))

router.get("/dashboard", getDashboardStatsController)
router.get("/jobs", getAssignedJobsController)
router.get("/jobs/:jobId", getJobByIdController)
router.patch("/jobs/:jobId/start", startJobController)
router.post(
  "/jobs/:jobId/progress",
  zodValidate(progressUpdateSchema),
  addProgressUpdateController
)
router.post(
  "/jobs/:jobId/evidence",
  uploadEvidenceMiddleware,
  uploadEvidenceController
)
router.post(
  "/jobs/:jobId/cost",
  zodValidate(costSubmissionSchema),
  submitCostController
)
router.patch(
  "/jobs/:jobId/complete",
  zodValidate(completeWorkSchema),
  completeJobController
)

export default router