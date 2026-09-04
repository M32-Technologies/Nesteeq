import type { Request, Response } from "express"

import { catchAsync } from "../../utils/catchAsync.js"
import { AppError } from "../../utils/AppError.js"

import {
  getSecurityActivityService,
  getSecurityFlatsService,
  getSecurityResidentsService,
  getSecuritySummaryService,
  verifyGuestPassService,
} from "./security.service.js"

export const verifyGuestPass = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context not found", 403)
    }

    const { token } = req.body

    const guestPass = await verifyGuestPassService({
      token,
      apartmentId,
    })

    res.status(200).json({
      success: true,
      message: "Guest pass verified successfully",
      data: guestPass,
    })
  }
)

export const getSecuritySummary = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context not found", 403)
    }

    const summary = await getSecuritySummaryService(apartmentId)

    res.status(200).json({
      success: true,
      message: "Security summary fetched successfully",
      data: summary,
    })
  }
)

export const getSecurityFlats = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context not found", 403)
    }

    const flats = await getSecurityFlatsService(apartmentId)

    res.status(200).json({
      success: true,
      message: "Security flat options fetched successfully",
      data: flats,
    })
  }
)

export const getSecurityResidents = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context not found", 403)
    }

    const result = await getSecurityResidentsService({
      apartmentId,
      search: req.query.search as string | undefined,
      page: req.query.page as number | undefined,
      limit: req.query.limit as number | undefined,
    })

    res.status(200).json({
      success: true,
      message: "Residents directory fetched successfully",
      data: result,
    })
  }
)

export const getSecurityActivity = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context not found", 403)
    }

    const result = await getSecurityActivityService({
      apartmentId,
      limit: req.query.limit as number | undefined,
    })

    res.status(200).json({
      success: true,
      message: "Recent gate activity fetched successfully",
      data: result,
    })
  }
)
