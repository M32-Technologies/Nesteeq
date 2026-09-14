import express from "express";
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
  zodValidate(createScheduleSchema),
  createScheduleHandler
);

router.get(
  "/schedules",
  zodValidate(getSchedulesSchema),
  getSchedulesHandler
);

router.get(
  "/schedules/my",
  zodValidate(getSchedulesSchema),
  getMySchedulesHandler
);

router.get(
  "/schedules/date/:date",
  zodValidate(getSchedulesByDateSchema),
  getSchedulesByDateHandler
);

router.get(
  "/schedules/status/:status",
  zodValidate(getSchedulesByStatusSchema),
  getSchedulesByStatusHandler
);

router.get(
  "/schedules/:id",
  zodValidate(getScheduleByIdSchema),
  getScheduleByIdHandler
);

router.patch(
  "/schedules/:id",
  zodValidate(updateScheduleSchema),
  updateScheduleHandler
);

router.patch(
  "/schedules/:id/reschedule",
  zodValidate(rescheduleSchema),
  rescheduleScheduleHandler
);

router.patch(
  "/schedules/:id/cancel",
  zodValidate(cancelScheduleSchema),
  cancelScheduleHandler
);

router.patch(
  "/schedules/:id/status",
  zodValidate(updateScheduleStatusSchema),
  updateScheduleStatusHandler
);

router.delete(
  "/schedules/:id",
  zodValidate(deleteScheduleSchema),
  deleteScheduleHandler
);

export default router;
