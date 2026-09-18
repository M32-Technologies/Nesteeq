import { Router, type Request, type Response } from "express"
import { protect } from "../../middlewares/authMiddleware.js"
import { uploadAvatarMiddleware } from "../../middlewares/uploadMiddleware.js"
import { AppError } from "../../utils/AppError.js"
import { env } from "../../config/env.js"

const router = Router()

router.post(
  "/avatar",
  protect,
  uploadAvatarMiddleware,
  (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No avatar file provided", 400)
    }

    const fileUrl = `${env.betterAuthUrl}/uploads/avatars/${req.file.filename}`

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    })
  }
)

export default router
