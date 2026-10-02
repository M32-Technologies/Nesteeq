import { Request, Response } from "express";
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
  reviewComplaintExpense,
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
  const user = req.user as Record<string, unknown> | undefined;
  const rawApartmentId = user?.apartmentId ?? user?.apartment ?? null;
  const rawFlatId = user?.flatId ?? user?.flat ?? null;

  return {
    id: req.user?.id ? String(req.user.id).trim() : "",
    role: req.user?.role ? String(req.user.role).trim() : "",
    apartmentId: rawApartmentId ? String(rawApartmentId).trim() : null,
    flatId: rawFlatId ? String(rawFlatId).trim() : null,
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

export const reviewComplaintExpenseHandler = catchAsync(async (req: Request, res: Response) => {
  const rawAction = String(req.body?.action || "").toUpperCase();
  const action = rawAction.startsWith("APPROV") ? "APPROVE" : "REJECT";
  const reason = req.body?.reason || req.body?.remarks || undefined;

  const result = await reviewComplaintExpense(
    getComplaintId(req),
    action,
    reason,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: `Maintenance expense ${action === "APPROVE" ? "approved" : "rejected"} successfully`,
    data: result,
  });
});

export const approveComplaintExpenseHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewComplaintExpense(
    getComplaintId(req),
    "APPROVE",
    undefined,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance expense approved successfully",
    data: result,
  });
});

export const rejectComplaintExpenseHandler = catchAsync(async (req: Request, res: Response) => {
  const reason = req.body?.reason || req.body?.remarks || undefined;
  const result = await reviewComplaintExpense(
    getComplaintId(req),
    "REJECT",
    reason,
    getAuthenticatedUser(req)
  );

  res.status(200).json({
    success: true,
    message: "Maintenance expense rejected successfully",
    data: result,
  });
});
