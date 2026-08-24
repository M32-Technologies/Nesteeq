import express from "express"
import { protect, requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import { residentListQuerySchema } from "./resident.validation.js";
import { getResidentDetailsHandler, getResidentHandler, updateResidentDetailsHandler, updateResidentStatusHandler } from "./resident.controller.js";
const router = express.Router() ;

router.get("/" , protect , zodValidate(residentListQuerySchema) , getResidentHandler)

router.patch("/:id/status" , protect , requireRole("property_manager") , updateResidentStatusHandler)

router.patch("/:id" , protect , requireRole("property_manager") , updateResidentDetailsHandler)

router.get("/:id" , protect , getResidentDetailsHandler)

export default router
