import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import {
  addProgressUpdate,
  completeJob,
  getAssignedJobs,
  getDashboardStats,
  getJobById,
  startJob,
  submitCost,
  uploadEvidence,
} from "./maintenance-technician.service.js"

const getAuthenticatedTechnicianId = (req: Request): string => {
  const technicianId = req.user?.id || (req.user as any)?._id?.toString()
  if (!technicianId) {
    throw new AppError("Authentication required", 401)
  }
  return technicianId
}

const getExtraTechnicianId = (req: Request): string | undefined => {
  return (
    (req.user as any)?.technicianId ||
    (req.user as any)?.technicianProfileId ||
    (req.user as any)?.staffRecordId ||
    (req.user as any)?.staffId
  )
}

export const getDashboardStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const data = await getDashboardStats(technicianId, extraTechId)

    res.status(200).json({
      success: true,
      message: "Maintenance technician dashboard stats fetched successfully",
      data,
    })
  }
)

export const getAssignedJobsController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const status = req.query.status ? String(req.query.status) : undefined
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined
    const order = req.query.order ? String(req.query.order) : undefined
    const data = await getAssignedJobs(status, technicianId, extraTechId, sortBy, order)

    res.status(200).json({
      success: true,
      message: "Assigned jobs fetched successfully",
      data,
    })
  }
)

export const getJobByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)
    const data = await getJobById(jobId, technicianId, extraTechId)

    res.status(200).json({
      success: true,
      message: "Job details fetched successfully",
      data,
    })
  }
)

export const startJobController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)
    const data = await startJob(jobId, technicianId, extraTechId)

    res.status(200).json({
      success: true,
      message: "Maintenance job started successfully",
      data,
    })
  }
)

export const addProgressUpdateController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)
    const { message } = req.body
    const data = await addProgressUpdate(
      jobId,
      String(message || ""),
      technicianId,
      extraTechId
    )

    res.status(201).json({
      success: true,
      message: "Progress update added successfully",
      data,
    })
  }
)

export const uploadEvidenceController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)

    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const file =
      req.file ||
      files?.file?.[0] ||
      files?.evidence?.[0] ||
      files?.receipt?.[0] ||
      (Array.isArray(req.files) ? req.files[0] : undefined)

    const data = await uploadEvidence(jobId, file, technicianId, extraTechId)

    res.status(200).json({
      success: true,
      message: "Evidence uploaded successfully",
      data,
    })
  }
)

export const submitCostController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)
    const {
      amount,
      expenseAmount,
      description,
      expenseDescription,
      receiptUrl,
      expenseReceiptUrl,
    } = req.body

    const finalAmount = Number(expenseAmount ?? amount) || 0
    const finalDescription = String(expenseDescription ?? description ?? "")
    const finalReceiptUrl = (expenseReceiptUrl ?? receiptUrl ?? null) as string | null

    const data = await submitCost(
      jobId,
      finalAmount,
      finalDescription,
      finalReceiptUrl,
      technicianId,
      extraTechId
    )

    res.status(200).json({
      success: true,
      message: "Maintenance cost submitted successfully",
      data,
    })
  }
)

export const completeJobController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const extraTechId = getExtraTechnicianId(req)
    const jobId = String(req.params.jobId)
    const { workSummary, notes } = req.body
    const data = await completeJob(
      jobId,
      {
        workSummary: String(workSummary || ""),
        notes: notes ? String(notes) : undefined,
      },
      technicianId,
      extraTechId
    )

    res.status(200).json({
      success: true,
      message: "Maintenance job marked as completed successfully",
      data,
    })
  }
)
