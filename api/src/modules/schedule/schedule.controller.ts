import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  cancelSchedule,
  createSchedule,
  deleteSchedule,
  getMySchedules,
  getScheduleById,
  getSchedules,
  rescheduleSchedule,
  updateSchedule,
  updateScheduleStatus,
  type AuthenticatedScheduleUser,
} from "./schedule.service.js";
import type {
  CancelScheduleInput,
  CreateScheduleInput,
  GetSchedulesQuery,
  RescheduleInput,
  ScheduleDateParams,
  ScheduleIdParams,
  ScheduleStatusParams,
  UpdateScheduleInput,
  UpdateScheduleStatusInput,
} from "./schedule.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedScheduleUser => {
  return {
    id: req.user?.id!,
    role: req.user?.role!,
    apartmentId: req.user?.apartmentId ?? null,
    flatId: req.user?.flatId ?? null,
  };
};

const getScheduleId = (req: Request): string => {
  const params = req.params as ScheduleIdParams;
  return params.id;
};

export const createScheduleHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await createSchedule(
    req.body as CreateScheduleInput,
    getAuthenticatedUser(req)
  );

  res.status(201).json({
    success: true,
    message: "Schedule created successfully",
    data: result,
  });
});

export const getSchedulesHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getSchedules(
    req.query as unknown as GetSchedulesQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMySchedulesHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getMySchedules(
    req.query as unknown as GetSchedulesQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getSchedulesByDateHandler = catchAsync(async (req: Request, res: Response) => {
  const params = req.params as ScheduleDateParams;
  const result = await getSchedules(
    {
      ...(req.query as unknown as GetSchedulesQuery),
      date: params.date,
    },
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getSchedulesByStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const params = req.params as ScheduleStatusParams;
  const result = await getSchedules(
    {
      ...(req.query as unknown as GetSchedulesQuery),
      status: params.status,
    },
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getScheduleByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getScheduleById(getScheduleId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateScheduleHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateSchedule(
    getScheduleId(req),
    req.body as UpdateScheduleInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Schedule updated successfully",
    data: result,
  });
});

export const rescheduleScheduleHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await rescheduleSchedule(
    getScheduleId(req),
    req.body as RescheduleInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Schedule rescheduled successfully",
    data: result,
  });
});

export const cancelScheduleHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await cancelSchedule(
    getScheduleId(req),
    req.body as CancelScheduleInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Schedule cancelled successfully",
    data: result,
  });
});

export const updateScheduleStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateScheduleStatus(
    getScheduleId(req),
    req.body as UpdateScheduleStatusInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Schedule status updated successfully",
    data: result,
  });
});

export const deleteScheduleHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await deleteSchedule(getScheduleId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    message: "Schedule deleted successfully",
    data: result,
  });
});
