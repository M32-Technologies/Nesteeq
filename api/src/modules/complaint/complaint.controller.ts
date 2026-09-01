import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  approveComplaint,
  assignComplaint,
  cancelComplaint,
  completeComplaintWork,
  confirmComplaintResolution,
  createComplaint,
  getComplaintById,
  getComplaints,
  rejectComplaint,
  updateComplaint,
  updateComplaintStatus,
  type AuthenticatedComplaintUser,
} from "./complaint.service.js";
import type {
  ApproveComplaintInput,
  AssignComplaintInput,
  CancelComplaintInput,
  ConfirmComplaintResolutionInput,
  CompleteComplaintWorkInput,
  ComplaintIdParams,
  CreateComplaintInput,
  GetComplaintsQuery,
  RejectComplaintInput,
  UpdateComplaintInput,
  UpdateComplaintStatusInput,
} from "./compliaint.schema.js";

const getAuthenticatedUser = (req: Request): AuthenticatedComplaintUser => {
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

const getComplaintId = (req: Request): string => {
  const params = req.params as ComplaintIdParams;
  return params.id;
};

export const createComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await createComplaint(req.body as CreateComplaintInput, getAuthenticatedUser(req));

  res.status(201).json({
    success: true,
    message: "Complaint created successfully",
    data: result,
  });
});

export const getComplaintsHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getComplaints(
    req.query as unknown as GetComplaintsQuery,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getComplaintByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getComplaintById(getComplaintId(req), getAuthenticatedUser(req));

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateComplaint(
    getComplaintId(req),
    req.body as UpdateComplaintInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint updated successfully",
    data: result,
  });
});

export const assignComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await assignComplaint(
    getComplaintId(req),
    req.body as AssignComplaintInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint assigned successfully",
    data: result,
  });
});

export const updateComplaintStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await updateComplaintStatus(
    getComplaintId(req),
    req.body as UpdateComplaintStatusInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint status updated successfully",
    data: result,
  });
});

export const completeComplaintWorkHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await completeComplaintWork(
    getComplaintId(req),
    req.body as CompleteComplaintWorkInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint work submitted for approval",
    data: result,
  });
});

export const approveComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await approveComplaint(
    getComplaintId(req),
    req.body as ApproveComplaintInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint approved successfully",
    data: result,
  });
});

export const rejectComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await rejectComplaint(
    getComplaintId(req),
    req.body as RejectComplaintInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint rejected successfully",
    data: result,
  });
});

export const cancelComplaintHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await cancelComplaint(
    getComplaintId(req),
    req.body as CancelComplaintInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint cancelled successfully",
    data: result,
  });
});

export const confirmComplaintResolutionHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await confirmComplaintResolution(
    getComplaintId(req),
    req.body as ConfirmComplaintResolutionInput,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Complaint resolution confirmed",
    data: result,
  });
});
