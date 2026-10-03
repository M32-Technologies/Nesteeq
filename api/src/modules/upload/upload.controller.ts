import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { UploadService } from "./upload.service.js";

export const getPresignedUrlHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const result = await UploadService.getPresignedUploadUrl({
    user: req.user,
    purpose: req.body.purpose,
    fileName: req.body.fileName,
    contentType: req.body.contentType,
    fileSize: req.body.fileSize,
    apartmentId: req.body.apartmentId,
    complaintId: req.body.complaintId,
    maintenanceId: req.body.maintenanceId,
  });

  return res.status(200).json({
    success: true,
    message: "Presigned upload URL generated successfully",
    data: result,
  });
});

export const getBatchPresignedUrlsHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const results = await UploadService.getBatchPresignedUploadUrls({
    user: req.user,
    purpose: req.body.purpose,
    files: req.body.files,
    apartmentId: req.body.apartmentId,
    complaintId: req.body.complaintId,
    maintenanceId: req.body.maintenanceId,
  });

  return res.status(200).json({
    success: true,
    message: "Batch presigned upload URLs generated successfully",
    data: {
      files: results,
    },
  });
});

export const getViewUrlHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const key = req.body.key as string;
  const result = await UploadService.getViewUrl(req.user, key);

  return res.status(200).json({
    success: true,
    message: "View URL generated successfully",
    data: result,
  });
});

export const deleteFileHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const key = req.body.key as string;
  await UploadService.deleteFile(req.user, key);

  return res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});
