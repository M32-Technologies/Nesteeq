import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  deleteNotificationHandler,
  getNotificationsHandler,
  getUnreadNotificationCountHandler,
  markAllNotificationsAsReadHandler,
  markNotificationAsReadHandler,
} from "./notification.controller.js";
import {
  deleteNotificationSchema,
  getNotificationsSchema,
  markNotificationAsReadSchema,
} from "./notification.validation.js";

const router = express.Router();

router.use(protect);

router.get("/unread-count", getUnreadNotificationCountHandler);
router.patch("/read-all", markAllNotificationsAsReadHandler);
router.patch(
  "/:id/read",
  zodValidate(markNotificationAsReadSchema),
  markNotificationAsReadHandler
);
router.delete(
  "/:id",
  zodValidate(deleteNotificationSchema),
  deleteNotificationHandler
);
router.get("/", zodValidate(getNotificationsSchema), getNotificationsHandler);

export default router;

