import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import {
  createEmergencyAlertService,
  listEmergencyAlertsService,
  updateEmergencyAlertStatusService,
} from "./alert.service.js"

const getAuthContext = (req: Request) => {
  const userId = req.user?.id
  const apartmentId = req.user?.apartmentId

  if (!userId) throw new AppError("Unauthorized", 401)
  if (!apartmentId) {
    throw new AppError("Apartment context not found", 403)
  }

  return {
    userId,
    apartmentId,
    userRole: req.user?.role,
  }
}

export const createEmergencyAlert = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId, userRole } =
      getAuthContext(req)

    const alert = await createEmergencyAlertService({
      userId,
      apartmentId,
      userRole,
      ...req.body,
    })

    res.status(201).json({
      success: true,
      message: "Emergency alert created successfully",
      data: alert,
    })
  }
)

export const listEmergencyAlerts = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getAuthContext(req)

    const result = await listEmergencyAlertsService({
      apartmentId,
      status: req.query.status as
        | "ALL"
        | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page as number | undefined,
      limit: req.query.limit as number | undefined,
    })

    res.status(200).json({
      success: true,
      message: "Emergency alerts fetched successfully",
      data: result,
    })
  }
)

export const updateEmergencyAlertStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getAuthContext(req)
    const alertId =
      typeof req.params.alertId === "string"
        ? req.params.alertId
        : undefined

    if (!alertId) {
      throw new AppError("Invalid emergency alert ID", 400)
    }

    const alert = await updateEmergencyAlertStatusService({
      userId,
      apartmentId,
      alertId,
      status: req.body.status,
      resolutionNotes: req.body.resolutionNotes,
    })

    res.status(200).json({
      success: true,
      message: "Emergency alert updated successfully",
      data: alert,
    })
  }
)
