import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  approveMaintenance,
  assignMaintenance,
  cancelMaintenance,
  closeMaintenance,
  completeMaintenance,
  createMaintenance,
  getMaintenance,
  getMaintenanceById,
  rejectMaintenance,
  startMaintenance,
  updateMaintenance,
  updateMaintenanceProgress,
  updateMaintenanceStatus,
  type AuthenticatedMaintenanceUser,
} from "./maintenance.service.js";
import type {
  ApproveMaintenanceInput,
  AssignMaintenanceInput,
  CancelMaintenanceInput,
  CloseMaintenanceInput,
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  GetMaintenanceQuery,
  MaintenanceIdParams,
  RejectMaintenanceInput,
  StartMaintenanceInput,
  UpdateMaintenanceInput,
  UpdateMaintenanceProgressInput,
  UpdateMaintenanceStatusInput,
} from "./maintenance.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedMaintenanceUser => {
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

const getMaintenanceId = (req: Request): string => {
  const params = req.params as MaintenanceIdParams;
  return params.id;
};

export const createMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await createMaintenance(
    req.body as CreateMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(201).json({
    success: true,
    message: "Maintenance created successfully",
    data: result,
  });
});

export const getMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getMaintenance(
    req.query as unknown as GetMaintenanceQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMaintenanceByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getMaintenanceById(getMaintenanceId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateMaintenance(
    getMaintenanceId(req),
    req.body as UpdateMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance updated successfully",
    data: result,
  });
});

export const assignMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await assignMaintenance(
    getMaintenanceId(req),
    req.body as AssignMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance assigned successfully",
    data: result,
  });
});

export const updateMaintenanceStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateMaintenanceStatus(
    getMaintenanceId(req),
    req.body as UpdateMaintenanceStatusInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance status updated successfully",
    data: result,
  });
});

export const startMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await startMaintenance(
    getMaintenanceId(req),
    req.body as StartMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance started successfully",
    data: result,
  });
});

export const updateMaintenanceProgressHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateMaintenanceProgress(
    getMaintenanceId(req),
    req.body as UpdateMaintenanceProgressInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance progress updated successfully",
    data: result,
  });
});

export const completeMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await completeMaintenance(
    getMaintenanceId(req),
    req.body as CompleteMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance work submitted for approval",
    data: result,
  });
});

export const approveMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await approveMaintenance(
    getMaintenanceId(req),
    req.body as ApproveMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance approved successfully",
    data: result,
  });
});

export const rejectMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await rejectMaintenance(
    getMaintenanceId(req),
    req.body as RejectMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance rejected successfully",
    data: result,
  });
});

export const cancelMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await cancelMaintenance(
    getMaintenanceId(req),
    req.body as CancelMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance cancelled successfully",
    data: result,
  });
});

export const closeMaintenanceHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await closeMaintenance(
    getMaintenanceId(req),
    req.body as CloseMaintenanceInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance closed successfully",
    data: result,
  });
});
