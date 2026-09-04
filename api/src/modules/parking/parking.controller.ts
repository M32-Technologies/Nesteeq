import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import {
  assignParkingSlotService,
  createParkingSlotService,
  generateParkingSlotsService,
  listParkingSlotsService,
  releaseParkingSlotService,
  updateParkingSlotService,
  updateParkingSlotStatusService,
} from "./parking.service.js"

const getSecurityContext = (req: Request) => {
  const userId = req.user?.id
  const apartmentId = req.user?.apartmentId

  if (!userId) throw new AppError("Unauthorized", 401)
  if (!apartmentId) {
    throw new AppError("Apartment context not found", 403)
  }

  return { userId, apartmentId }
}


export const createParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const slot = await createParkingSlotService({
      apartmentId,
      ...req.body,
    })

    res.status(201).json({
      success: true,
      message: "Parking slot created successfully",
      data: slot,
    })
  }
)

export const listParkingSlots = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const result = await listParkingSlotsService({
      apartmentId,
      status: req.query.status as
        | "ALL"
        | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })

    res.status(200).json({
      success: true,
      message: "Visitor parking slots fetched successfully",
      data: result,
    })
  }
)

export const updateParkingSlotStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)
    const slotId =
      typeof req.params.slotId === "string"
        ? req.params.slotId
        : undefined

    if (!slotId) {
      throw new AppError("Invalid parking slot ID", 400)
    }

    const slot = await updateParkingSlotStatusService({
      apartmentId,
      slotId,
      status: req.body.status,
      notes: req.body.notes,
    })

    res.status(200).json({
      success: true,
      message: "Parking slot updated successfully",
      data: slot,
    })
  }
)

export const assignParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, userId } = getSecurityContext(req)

    await assignParkingSlotService({
      apartmentId,
      userId,
      ...req.body,
    })

    const result = await listParkingSlotsService({
      apartmentId,
    })

    res.status(201).json({
      success: true,
      message: "Parking slot assigned successfully",
      data: result,
    })
  }
)

export const releaseParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, userId } = getSecurityContext(req)
    const slotId =
      typeof req.params.slotId === "string"
        ? req.params.slotId
        : undefined

    if (!slotId) {
      throw new AppError("Invalid parking slot ID", 400)
    }

    const slot = await releaseParkingSlotService({
      apartmentId,
      userId,
      slotId,
    })

    res.status(200).json({
      success: true,
      message: "Parking slot released successfully",
      data: slot,
    })
  }
)




export const generateParkingSlots = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } =
      getSecurityContext(req)

    const result =
      await generateParkingSlotsService(
        req.body,
        apartmentId
      )

    res.status(201).json({
      success: true,
      message: `parking slots generated successfully`,
      data: result,
    })
  }
)

export const updateParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)
    const slotId =
      typeof req.params.slotId === "string"
        ? req.params.slotId
        : undefined

    if (!slotId) {
      throw new AppError("Invalid parking slot ID", 400)
    }

    const slot = await updateParkingSlotService({
      apartmentId,
      slotId,
      ...req.body,
    })

    res.status(200).json({
      success: true,
      message: "Parking slot updated successfully",
      data: slot,
    })
  }
)