import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
  deleteNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.service.js";
import type { GetNotificationsQuery } from "./notification.validation.js";

export const getNotificationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const query = req.query as unknown as GetNotificationsQuery;

    const result = await getMyNotifications({userId: user.id,apartmentId: user.apartmentId ?? null, query,});

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: result,
    });
  }
);

export const getUnreadNotificationCountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const result = await getUnreadNotificationCount({
      userId: user.id,
      apartmentId: user.apartmentId ?? null,
    });

    res.status(200).json({
      success: true,
      message: "Unread notification count fetched successfully",
      data: result,
    });
  }
);

export const markNotificationAsReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const result = await markNotificationAsRead({
      notificationId: String(req.params.id),
      userId: user.id,
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      data: result,
    });
  }
);

export const markAllNotificationsAsReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const result = await markAllNotificationsAsRead({
      userId: user.id,
      apartmentId: user.apartmentId ?? null,
    });

    const message =
      result.modifiedCount > 0
        ? "All notifications marked as read successfully"
        : "All notifications are already read";

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  }
);

export const deleteNotificationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError("Authentication required", 401);
    }

    await deleteNotification({
      notificationId: String(req.params.id),
      userId: user.id,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: null,
    });
  }
);




