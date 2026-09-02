import express from "express";

import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  createFlatHandler,
  deactivateFlatHandler,
  generateFlatsHandler,
  getFlatByIdHandler,
  getFlatHandler,
  updateFlatHandler,
} from "./flat.controller.js";
import {
  createFlatSchema,
  deactivateFlatSchema,
  flatListQuerySchema,
  generateFlatsSchema,
  getFlatByIdSchema,
  updateFlatStatusSchema,
  updateFlatSchema,
} from "./flat.schema.js";

const router = express.Router();
const managerOnly = requireRole("property_manager");

router.post("/", protect , managerOnly , zodValidate(createFlatSchema),createFlatHandler,);

router.post(
  "/generate",
  protect,
  managerOnly,
  zodValidate(generateFlatsSchema),
  generateFlatsHandler,
);

router.get(
  "/",
  protect,
  managerOnly,
  zodValidate(flatListQuerySchema),
  getFlatHandler,
);

router.get(
  "/:id",
  protect,
  managerOnly,
  zodValidate(getFlatByIdSchema),
  getFlatByIdHandler,
);

router.patch(
  "/:id/status",
  protect,
  managerOnly,
  zodValidate(updateFlatStatusSchema),
  deactivateFlatHandler,
);

router.patch(
  "/:id/deactivate",
  protect,
  managerOnly,
  zodValidate(deactivateFlatSchema),
  deactivateFlatHandler,
);

router.patch(
  "/:id",
  protect,
  managerOnly,
  zodValidate(updateFlatSchema),
  updateFlatHandler,
);

export default router;
