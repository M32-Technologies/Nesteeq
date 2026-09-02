import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import {
  createDeliveryService,
  listDeliveriesService,
  updateDeliveryStatusService,
} from "./delivery.service.js"

const getSecurityContext = (req: Request) => {
  const userId = req.user?.id
  const apartmentId = req.user?.apartmentId

  if (!userId) throw new AppError("Unauthorized", 401)
  if (!apartmentId) {
    throw new AppError("Apartment context not found", 403)
  }

  return { userId, apartmentId }
}

export const createDelivery = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)

    const delivery = await createDeliveryService({
      apartmentId,
      userId,
      ...req.body,
    })

    res.status(201).json({
      success: true,
      message: "Delivery recorded successfully",
      data: delivery,
    })
  }
)

export const listDeliveries = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const result = await listDeliveriesService({
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
      message: "Deliveries fetched successfully",
      data: result,
    })
  }
)

export const updateDeliveryStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)
    const deliveryId =
      typeof req.params.deliveryId === "string"
        ? req.params.deliveryId
        : undefined

    if (!deliveryId) {
      throw new AppError("Invalid delivery ID", 400)
    }

    const delivery = await updateDeliveryStatusService({
      apartmentId,
      userId,
      deliveryId,
      status: req.body.status,
      notes: req.body.notes,
    })

    res.status(200).json({
      success: true,
      message: "Delivery updated successfully",
      data: delivery,
    })
  }
)
