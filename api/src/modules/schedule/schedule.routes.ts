import express from "express";
import {
  MANAGEMENT_ROUTE_ROLES as managementRoles,
  MAINTENANCE_ROUTE_ROLES as maintenanceRoles,
  SCHEDULE_ACCESS_ROUTE_ROLES as scheduleAccessRoles,
} from "../../constants/roles.js";
import { authorize } from "../../middlewares/authorizeMiddleware.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  cancelScheduleHandler,
  createScheduleHandler,
  deleteScheduleHandler,
  getMySchedulesHandler,
  getScheduleByIdHandler,
  getSchedulesByDateHandler,
  getSchedulesByStatusHandler,
  getSchedulesHandler,
  rescheduleScheduleHandler,
  updateScheduleHandler,
  updateScheduleStatusHandler,
} from "./schedule.controller.js";
import {
  cancelScheduleSchema,
  createScheduleSchema,
  deleteScheduleSchema,
  getScheduleByIdSchema,
  getSchedulesByDateSchema,
  getSchedulesByStatusSchema,
  getSchedulesSchema,
  rescheduleSchema,
  updateScheduleSchema,
  updateScheduleStatusSchema,
} from "./schedule.schema.js";

const router = express.Router();

router.use(protect);

router.post(
  "/schedules",
  authorize(...managementRoles),
  zodValidate(createScheduleSchema),
  createScheduleHandler
);

router.get(
  "/schedules",
  authorize(...scheduleAccessRoles),
  zodValidate(getSchedulesSchema),
  getSchedulesHandler
);

router.get(
  "/schedules/my",
  authorize(...maintenanceRoles),
  zodValidate(getSchedulesSchema),
  getMySchedulesHandler
);

router.get(
  "/schedules/date/:date",
  authorize(...scheduleAccessRoles),
  zodValidate(getSchedulesByDateSchema),
  getSchedulesByDateHandler
);

router.get(
  "/schedules/status/:status",
  authorize(...scheduleAccessRoles),
  zodValidate(getSchedulesByStatusSchema),
  getSchedulesByStatusHandler
);

router.get(
  "/schedules/:id",
  authorize(...scheduleAccessRoles),
  zodValidate(getScheduleByIdSchema),
  getScheduleByIdHandler
);

router.patch(
  "/schedules/:id",
  authorize(...managementRoles),
  zodValidate(updateScheduleSchema),
  updateScheduleHandler
);

router.patch(
  "/schedules/:id/reschedule",
  authorize(...managementRoles),
  zodValidate(rescheduleSchema),
  rescheduleScheduleHandler
);

router.patch(
  "/schedules/:id/cancel",
  authorize(...managementRoles),
  zodValidate(cancelScheduleSchema),
  cancelScheduleHandler
);

router.patch(
  "/schedules/:id/status",
  authorize(...scheduleAccessRoles),
  zodValidate(updateScheduleStatusSchema),
  updateScheduleStatusHandler
);

router.delete(
  "/schedules/:id",
  authorize(...managementRoles),
  zodValidate(deleteScheduleSchema),
  deleteScheduleHandler
);

export default router;
