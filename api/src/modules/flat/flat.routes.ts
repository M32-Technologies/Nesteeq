import express from "express"
import { Types } from "mongoose"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import { Flat } from "./flat.model.js"

const router = express.Router()
const managerOnly = requireRole("property_manager")

router.get(
  "/",
  protect,
  managerOnly,
  catchAsync(async (req, res) => {
    const apartmentId = req.user?.apartmentId
    const blockId = typeof req.query.blockId === "string"
      ? req.query.blockId
      : undefined

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    if (blockId && !Types.ObjectId.isValid(blockId)) {
      throw new AppError("Block id must be a valid id", 400)
    }

    const flats = await Flat.find({
      apartmentId,
      ...(blockId ? { blockId: new Types.ObjectId(blockId) } : {}),
    })
      .select("_id blockId flatNumber occupancyStatus")
      .sort({ flatNumber: 1 })
      .lean()

    res.status(200).json({
      success: true,
      data: {
        flats: flats.map((flat) => ({
          id: flat._id.toString(),
          blockId: flat.blockId.toString(),
          flatNumber: flat.flatNumber,
          occupancyStatus: flat.occupancyStatus,
        })),
      },
    })
  })
)

export default router
