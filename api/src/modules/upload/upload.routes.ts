import { Router, type Request, type Response, type NextFunction } from "express";
import { uploadImageMiddleware } from "../../middlewares/uploadMiddleware.js";
import { AppError } from "../../utils/AppError.js";

const router = Router();

router.post(
  "/",
  uploadImageMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);

      if (!file) {
        return next(new AppError("No file uploaded. Please attach an image file.", 400));
      }

      const host = req.get("host") || `localhost:${process.env.PORT || 6001}`;
      const protocol = req.protocol || "http";
      const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
      const relativePath = `/uploads/${file.filename}`;

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: fileUrl,
          path: relativePath,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
