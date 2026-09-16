import type { Request, Response } from "express";

import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  broadcastEmergencyService,
  createAnnouncementService,
  deleteAnnouncementService,
  getAnnouncementByIdService,
  getAnnouncementsService,
  getResidentAnnouncementsService,
  updateAnnouncementService,
  updateAnnouncementStatusService,
} from "./announcements.service.js";
import type {
  ListAnnouncementsQuery,
  UpdateAnnouncementBody,
  UpdateAnnouncementStatusBody,
} from "./announcements.validation.js";

export const createAnnouncementHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const result = await createAnnouncementService(
      apartmentId,
      userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: result,
    });
  }
);

export const broadcastEmergencyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const result = await broadcastEmergencyService(
      apartmentId,
      userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Emergency alert broadcasted successfully",
      data: result,
    });
  }
);

export const getAnnouncementsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const query = req.query as unknown as ListAnnouncementsQuery;
    const result = await getAnnouncementsService(apartmentId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const getAnnouncementByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const announcementId = String(req.params.announcementId);
    const result = await getAnnouncementByIdService(
      apartmentId,
      announcementId
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const updateAnnouncementHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const announcementId = String(req.params.announcementId);
    const body = req.body as UpdateAnnouncementBody;

    const result = await updateAnnouncementService(
      apartmentId,
      announcementId,
      body
    );

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: result,
    });
  }
);

export const updateAnnouncementStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const announcementId = String(req.params.announcementId);
    const { status } = req.body as UpdateAnnouncementStatusBody;

    const result = await updateAnnouncementStatusService(
      apartmentId,
      announcementId,
      status
    );

    res.status(200).json({
      success: true,
      message: `Announcement status updated to ${status}`,
      data: result,
    });
  }
);

export const deleteAnnouncementHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const announcementId = String(req.params.announcementId);
    const result = await deleteAnnouncementService(
      apartmentId,
      announcementId
    );

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
      data: result,
    });
  }
);

export const getResidentAnnouncementsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!apartmentId) throw new AppError("Apartment context not found", 403);

    const result = await getResidentAnnouncementsService(apartmentId, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);