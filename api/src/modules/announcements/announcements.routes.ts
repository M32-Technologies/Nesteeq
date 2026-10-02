import { Router } from "express";

import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  broadcastEmergencyHandler,
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
  emergencyBroadcastSchema,
  listAnnouncementsSchema,
  updateAnnouncementSchema,
  updateAnnouncementStatusSchema,
} from "./announcements.validation.js";

const router = Router();

router.use(protect);

// Resident-specific feed: published, active announcements
router.get("/resident-feed", getResidentAnnouncementsHandler);

// List announcements (supports pagination, filtering by type/status/search/targetType)
router.get(
  "/",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(listAnnouncementsSchema),
  getAnnouncementsHandler
);

// Create announcement (Property managers, facility managers, and security staff)
router.post(
  "/",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(createAnnouncementSchema),
  createAnnouncementHandler
);

// Dedicated Emergency Broadcast endpoint
router.post(
  "/emergency",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(emergencyBroadcastSchema),
  broadcastEmergencyHandler
);

// Get single announcement details
router.get(
  "/:announcementId",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(announcementIdParamsSchema),
  getAnnouncementByIdHandler
);

// Update announcement
router.patch(
  "/:announcementId",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(updateAnnouncementSchema),
  updateAnnouncementHandler
);

// Quick update status (draft, published, archived)
router.patch(
  "/:announcementId/status",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(updateAnnouncementStatusSchema),
  updateAnnouncementStatusHandler
);

// Delete announcement (Property manager, facility manager, and security staff)
router.delete(
  "/:announcementId",
  requireRole("property_manager", "facility_manager", "security_staff"),
  zodValidate(announcementIdParamsSchema),
  deleteAnnouncementHandler
);

export default router;
