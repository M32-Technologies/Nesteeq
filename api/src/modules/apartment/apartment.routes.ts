import { Router } from "express";

import {
  createApartment,
  addBlocks,
  addFlats,
  getApartment,
} from "./apartment.controller.js";

import {
  createApartmentSchema,
  updateBlocksSchema,
  updateFlatsSchema,
} from "./apartment.schema.js";

import { zodValidate } from "../../middlewares/zodValidate.js";

const router = Router();

router.post("/", zodValidate(createApartmentSchema), createApartment);
router.get("/:id", getApartment);
router.patch("/:id/blocks", zodValidate(updateBlocksSchema), addBlocks);
router.patch("/:id/flats", zodValidate(updateFlatsSchema), addFlats);

export default router;