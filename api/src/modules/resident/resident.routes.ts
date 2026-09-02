import express from "express"
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import { residentListQuerySchema } from "./resident.validation.js";
import { getResidentDetailsHandler, getResidentHandler, updateResidentDetailsHandler, updateResidentStatusHandler } from "./resident.controller.js";
const router = express.Router() ;

router.get("/" , protect , zodValidate(residentListQuerySchema) , getResidentHandler)

router.patch("/:id/status" , protect , updateResidentStatusHandler)

router.patch("/:id" , protect , updateResidentDetailsHandler)

router.get("/:id" , protect , getResidentDetailsHandler)

export default router
