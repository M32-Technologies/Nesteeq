import express from "express";
import {
    createApartmentHandler,
    getCurrentApartmentHandler,
    getPendingApartmentHandler,
    updateCurrentApartmentHandler,
} from "./apartment.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import { createApartmentSchema, updateApartmentSchema } from "./apartment.validation.js";

const router = express.Router()

router.get("/current", protect, getCurrentApartmentHandler)
router.get("/pending", protect, getPendingApartmentHandler)

router.post("/", protect, zodValidate(createApartmentSchema), createApartmentHandler)
router.patch("/current", protect, zodValidate(updateApartmentSchema), updateCurrentApartmentHandler)

export default router 

