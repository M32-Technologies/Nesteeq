import type { Request, Response } from "express"

import { catchAsync } from "../../../utils/catchAsync.js"
import { AppError } from "../../../utils/AppError.js"

import {
  createGuestPassService,
  getGuestPassesService,
  getGuestPassByIdService,
  cancelGuestPassService,
} from "./pass.service.js"

const getQueryNumber = (value: unknown) =>
  typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value)
      : undefined

/**
 * Create a new Guest Pass
 *
 * POST /api/visitors/passes
 */
export const createGuestPass = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const {
      flatId,
      visitorName,
      visitorPhone,
      purpose,
      vehicleNumber,
      validFrom,
      validUntil,
    } = req.body

    const result = await createGuestPassService({
      userId,
      flatId,
      visitorName,
      visitorPhone,
      purpose,
      vehicleNumber,
      validFrom,
      validUntil,
    })

    res.status(201).json({
      success: true,
      message: "Guest pass created successfully",
      data: result,
    })
  }
)

/**
 * Get Guest Passes created by current resident
 *
 * GET /api/visitors/passes
 */
export const getGuestPasses = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const page = getQueryNumber(req.query.page)

    const limit = getQueryNumber(req.query.limit)

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined

    const result = await getGuestPassesService({
      userId,
      page,
      limit,
      status: status as
        | "ACTIVE"
        | "CANCELLED"
        | "EXPIRED"
        | undefined,
    })

    res.status(200).json({
      success: true,
      message: "Guest passes fetched successfully",
      data: result,
    })
  }
)

/**
 * Get a single Guest Pass
 *
 * GET /api/visitors/passes/:guestPassId
 */
export const getGuestPassById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const guestPassId =
      typeof req.params.guestPassId === "string"
        ? req.params.guestPassId
        : undefined

    if (!guestPassId) {
      throw new AppError("Invalid guest pass ID", 400)
    }

    const guestPass =
      await getGuestPassByIdService({
        userId,
        guestPassId,
      })

    res.status(200).json({
      success: true,
      message: "Guest pass fetched successfully",
      data: guestPass,
    })
  }
)

/**
 * Cancel a Guest Pass
 *
 * PATCH /api/visitors/passes/:guestPassId/cancel
 */
export const cancelGuestPass = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const guestPassId =
      typeof req.params.guestPassId === "string"
        ? req.params.guestPassId
        : undefined

    if (!guestPassId) {
      throw new AppError("Invalid guest pass ID", 400)
    }

    const guestPass =
      await cancelGuestPassService({
        userId,
        guestPassId,
      })

    res.status(200).json({
      success: true,
      message: "Guest pass cancelled successfully",
      data: guestPass,
    })
  }
)
