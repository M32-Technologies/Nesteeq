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
  const technicianId = req.user?.id
  if (!technicianId) {
    throw new AppError("Authentication required", 401)
  }
  return technicianId
}

export const getDashboardStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const data = await getDashboardStats(technicianId)

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
    const status = req.query.status ? String(req.query.status) : undefined
    const data = await getAssignedJobs(status, technicianId)

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
    const jobId = String(req.params.jobId)
    const data = await getJobById(jobId, technicianId)

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
    const jobId = String(req.params.jobId)
    const data = await startJob(jobId, technicianId)

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
    const jobId = String(req.params.jobId)
    const { message } = req.body
    const data = await addProgressUpdate(
      jobId,
      String(message || ""),
      technicianId
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
    const jobId = String(req.params.jobId)
    const data = await uploadEvidence(jobId, req.file, technicianId)

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
    const jobId = String(req.params.jobId)
    const { amount, description } = req.body
    const data = await submitCost(
      jobId,
      Number(amount) || 0,
      String(description || ""),
      technicianId
    )

    res.status(201).json({
      success: true,
      message: "Maintenance cost submitted successfully",
      data,
    })
  }
)

export const completeJobController = catchAsync(
  async (req: Request, res: Response) => {
    const technicianId = getAuthenticatedTechnicianId(req)
    const jobId = String(req.params.jobId)
    const { workSummary, notes } = req.body
    const data = await completeJob(
      jobId,
      {
        workSummary: String(workSummary || ""),
        notes: notes ? String(notes) : undefined,
      },
      technicianId
    )

    res.status(200).json({
      success: true,
      message: "Maintenance job marked as completed successfully",
      data,
    })
  }
)
