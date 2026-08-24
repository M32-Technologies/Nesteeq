import express from "express"

import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import { Block } from "./block.model.js"

const router = express.Router()
const managerOnly = requireRole("property_manager")

router.get(
  "/",
  protect,
  managerOnly,
  catchAsync(async (req, res) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    const blocks = await Block.find({ apartmentId })
      .select("_id blockname")
      .sort({ blockname: 1 })
      .lean()

    res.status(200).json({
      success: true,
      data: {
        blocks: blocks.map((block) => ({
          id: block._id.toString(),
          name: block.blockname,
        })),
      },
    })
  })
)

export default router
