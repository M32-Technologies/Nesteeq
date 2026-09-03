import { Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync.js"
import { AppError } from "../../utils/AppError.js"
import {
  getStaff,
  getStaffDetails,
  updateStaffDetails,
  updateStaffStatus,
} from "./staff.service.js"
import type { StaffListQuery } from "./staff.validation.js"

export const getStaffHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    const result = await getStaff(
      req.query as unknown as StaffListQuery,
      apartmentId,
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  },
)

export const getStaffDetailsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    const result = await getStaffDetails(String(req.params.id), apartmentId)

    res.status(200).json({
      success: true,
      data: result,
    })
  },
)

export const updateStaffStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    const result = await updateStaffStatus(
      String(req.params.id),
      apartmentId,
      req.body?.status,
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  },
)

export const updateStaffDetailsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId

    if (!apartmentId) {
      throw new AppError("Apartment context is required", 400)
    }

    const result = await updateStaffDetails(
      String(req.params.id),
      apartmentId,
      req.body,
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  },
)
