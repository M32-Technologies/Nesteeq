import express from "express";
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

router.use(protect);

router.post(
  "/technicians",
  zodValidate(createTechnicianSchema),
  createTechnicianHandler
);

router.get(
  "/technicians",
  zodValidate(getTechniciansSchema),
  getTechniciansHandler
);

router.get(
  "/technicians/:id/tasks",
  zodValidate(getTechnicianTasksSchema),
  getTechnicianTasksHandler
);

router.patch(
  "/technicians/:id/tasks/status",
  zodValidate(updateTechnicianTaskStatusSchema),
  updateTechnicianTaskStatusHandler
);

router.patch(
  "/technicians/:id/assign",
  zodValidate(assignTechnicianWorkSchema),
  assignTechnicianWorkHandler
);

router.patch(
  "/technicians/:id/status",
  zodValidate(updateTechnicianStatusSchema),
  updateTechnicianStatusHandler
);

router.get(
  "/technicians/:id",
  zodValidate(getTechnicianByIdSchema),
  getTechnicianByIdHandler
);

router.patch(
  "/technicians/:id",
  zodValidate(updateTechnicianSchema),
  updateTechnicianHandler
);

router.delete(
  "/technicians/:id",
  zodValidate(deleteTechnicianSchema),
  deactivateTechnicianHandler
);

export default router;
