import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  assignTechnicianWork,
  createTechnician,
  deactivateTechnician,
  getTechnicianById,
  getTechnicianTasks,
  getTechnicians,
  updateTechnician,
  updateTechnicianStatus,
  updateTechnicianTaskStatus,
  type AuthenticatedTechnicianUser,
} from "./technician.service.js";
import type {
  AssignTechnicianWorkInput,
  CreateTechnicianInput,
  GetTechnicianTasksQuery,
  GetTechniciansQuery,
  TechnicianIdParams,
  UpdateTechnicianInput,
  UpdateTechnicianStatusInput,
  UpdateTechnicianTaskStatusInput,
} from "./technician.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedTechnicianUser => {
  if (!req.user?.id || !req.user.role) {
    throw new AppError("Authentication required", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    apartmentId: req.user.apartmentId ?? null,
    flatId: req.user.flatId ?? null,
  };
};

const getTechnicianId = (req: Request): string => {
  const params = req.params as TechnicianIdParams;
  return params.id;
};

export const createTechnicianHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await createTechnician(
    req.body as CreateTechnicianInput,
    getAuthenticatedUser(req)
  );

  res.status(201).json({
    success: true,
    message: "Technician created successfully",
    data: result,
  });
});

export const getTechniciansHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getTechnicians(
    req.query as unknown as GetTechniciansQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getTechnicianByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getTechnicianById(getTechnicianId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateTechnicianHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateTechnician(
    getTechnicianId(req),
    req.body as UpdateTechnicianInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Technician updated successfully",
    data: result,
  });
});

export const updateTechnicianStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateTechnicianStatus(
    getTechnicianId(req),
    req.body as UpdateTechnicianStatusInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Technician status updated successfully",
    data: result,
  });
});

export const deactivateTechnicianHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await deactivateTechnician(getTechnicianId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    message: "Technician deactivated successfully",
    data: result,
  });
});

export const assignTechnicianWorkHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await assignTechnicianWork(
    getTechnicianId(req),
    req.body as AssignTechnicianWorkInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Work assigned successfully",
    data: result,
  });
});

export const getTechnicianTasksHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getTechnicianTasks(
    getTechnicianId(req),
    req.query as unknown as GetTechnicianTasksQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateTechnicianTaskStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateTechnicianTaskStatus(
    getTechnicianId(req),
    req.body as UpdateTechnicianTaskStatusInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Task status updated successfully",
    data: result,
  });
});
