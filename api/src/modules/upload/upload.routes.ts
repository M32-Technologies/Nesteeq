import { Router } from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
import {
  getPresignedUrlSchema,
  getBatchPresignedUrlsSchema,
  getViewUrlSchema,
  deleteFileSchema,
} from "./upload.validation.js";
import {
  getPresignedUrlHandler,
  getBatchPresignedUrlsHandler,
  getViewUrlHandler,
  deleteFileHandler,
} from "./upload.controller.js";

const router = Router();

// 1. Single S3 presigned PUT URL
router.post(
  "/presigned-url",
  protect,
  zodValidate(getPresignedUrlSchema),
  getPresignedUrlHandler,
);

// 2. Batch S3 presigned PUT URLs
router.post(
  "/presigned-urls",
  protect,
  zodValidate(getBatchPresignedUrlsSchema),
  getBatchPresignedUrlsHandler,
);

// 3. S3 temporary GET URL for viewing private files
router.post(
  "/view-url",
  protect,
  zodValidate(getViewUrlSchema),
  getViewUrlHandler,
);

// 4. S3 file deletion
router.delete(
  "/file",
  protect,
  zodValidate(deleteFileSchema),
  deleteFileHandler,
);

export default router;
