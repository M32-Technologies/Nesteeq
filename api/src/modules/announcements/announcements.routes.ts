import { Router } from "express";

import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAnnouncementByIdHandler,
  getAnnouncementsHandler,
  getResidentAnnouncementsHandler,
  updateAnnouncementHandler,
  updateAnnouncementStatusHandler,
} from "./announcements.controller.js";
import {
  announcementIdParamsSchema,
  createAnnouncementSchema,
  listAnnouncementsSchema,
  updateAnnouncementSchema,
  updateAnnouncementStatusSchema,
} from "./announcements.validation.js";

const router = Router();

router.use(protect);

// Resident-specific feed: published, active announcements
router.get("/resident-feed", getResidentAnnouncementsHandler);

// List announcements (supports pagination, filtering by type/status/search/targetType)
router.get("/", zodValidate(listAnnouncementsSchema), getAnnouncementsHandler);

// Create announcement (Property managers and security staff)
router.post(
  "/",
  requireRole("property_manager", "security_staff"),
  zodValidate(createAnnouncementSchema),
  createAnnouncementHandler
);

// Get single announcement details
router.get(
  "/:announcementId",
  zodValidate(announcementIdParamsSchema),
  getAnnouncementByIdHandler
);

// Update announcement
router.patch(
  "/:announcementId",
  requireRole("property_manager", "security_staff"),
  zodValidate(updateAnnouncementSchema),
  updateAnnouncementHandler
);

// Quick update status (draft, published, archived)
router.patch(
  "/:announcementId/status",
  requireRole("property_manager", "security_staff"),
  zodValidate(updateAnnouncementStatusSchema),
  updateAnnouncementStatusHandler
);

// Delete announcement (Property manager only)
router.delete(
  "/:announcementId",
  requireRole("property_manager"),
  zodValidate(announcementIdParamsSchema),
  deleteAnnouncementHandler
);

export default router;
