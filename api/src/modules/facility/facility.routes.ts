import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { getFacilityDashboardHandler } from "./facility.controller.js";

const router = express.Router();

router.use(protect);

router.get(
  "/facility/dashboard",
  getFacilityDashboardHandler
);

export default router;
