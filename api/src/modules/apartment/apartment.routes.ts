import express from "express";
import {
    createApartmentHandler,
    getCurrentApartmentHandler,
    getPendingApartmentHandler,
} from "./apartment.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import { createApartmentSchema } from "./apartment.validation.js";

const router = express.Router()

router.get("/current", protect, getCurrentApartmentHandler)
router.get("/pending", protect, getPendingApartmentHandler)
router.post("/", protect, zodValidate(createApartmentSchema), createApartmentHandler,)


export default router 
