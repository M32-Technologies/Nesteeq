import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"
import {
  assignParkingSlotService,
  assignResidentParking,
  createParkingSlotService,
  generateParkingSlots as generateManagerParkingSlots,
  generateParkingSlotsService,
  getParkingSlotById,
  getParkingSlots as getManagerParkingSlots,
  getParkingStats,
  listParkingSlotsService,
  releaseParkingSlotService,
  releaseResidentParking,
  updateParkingSlot as updateManagerParkingSlot,
  updateParkingSlotService,
  updateParkingSlotStatus as updateManagerParkingSlotStatus,
  updateParkingSlotStatusService,
} from "./parking.service.js"
import type {
  GetParkingSlotsQuery,
  ManagerGenerateParkingSlotsInput,
  ParkingIdParams,
  UpdateParkingSlotStatusInput,
  VisitorParkingStatusUpdate,
} from "./parking.schema.js"
import type { VisitorParkingSlotStatus } from "./parking.interface.js"

const getParkingContext = (req: Request) => {
  const userId = req.user?.id
  const apartmentId = req.user?.apartmentId

  if (!userId) throw new AppError("Unauthorized", 401)
  if (!apartmentId) throw new AppError("Apartment context not found", 403)

  return { userId, apartmentId }
}

const isManagerParkingRequest = (req: Request) =>
  req.baseUrl.includes("/api/v1/parking")

const getParkingId = (req: Request) => {
  const { parkingId } = req.params as unknown as ParkingIdParams
  if (!parkingId) throw new AppError("Invalid parking slot ID", 400)
  return parkingId
}

export const createParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
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
    const { apartmentId } = getParkingContext(req)

    if (isManagerParkingRequest(req)) {
      const result = await getManagerParkingSlots(
        req.query as unknown as GetParkingSlotsQuery,
        apartmentId
      )

      res.status(200).json({ success: true, data: result })
      return
    }

    const query = req.query as unknown as GetParkingSlotsQuery
    const result = await listParkingSlotsService({
      apartmentId,
      status: query.status as "ALL" | VisitorParkingSlotStatus | undefined,
      vehicleType: query.vehicleType,
      search: query.search,
      page: query.page,
      limit: query.limit,
    })

    res.status(200).json({
      success: true,
      message: "Visitor parking slots fetched successfully",
      data: result,
    })
  }
)

export const getParkingStatsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const result = await getParkingStats(apartmentId)

    res.status(200).json({ success: true, data: result })
  }
)

export const getParkingSlotByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const parkingSlot = await getParkingSlotById(
      getParkingId(req),
      apartmentId
    )

    res.status(200).json({ success: true, data: parkingSlot })
  }
)

export const generateParkingSlots = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const isManagerRequest =
      isManagerParkingRequest(req) || "level" in req.body
    const result = isManagerRequest
      ? await generateManagerParkingSlots(
          apartmentId,
          req.body as ManagerGenerateParkingSlotsInput
        )
      : await generateParkingSlotsService(req.body, apartmentId)

    res.status(201).json({
      success: true,
      message: "Parking slots generated successfully",
      data: result,
    })
  }
)

export const updateParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const parkingId = getParkingId(req)
    const slot = isManagerParkingRequest(req)
      ? await updateManagerParkingSlot(parkingId, req.body, apartmentId)
      : await updateParkingSlotService({
          apartmentId,
          slotId: parkingId,
          ...req.body,
        })

    res.status(200).json({
      success: true,
      message: "Parking slot updated successfully",
      data: slot,
    })
  }
)

export const updateParkingSlotStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, userId } = getParkingContext(req)
    const parkingId = getParkingId(req)
    const { status, notes } = req.body as UpdateParkingSlotStatusInput

    if (isManagerParkingRequest(req)) {
      if (status !== "AVAILABLE" && status !== "INACTIVE") {
        throw new AppError("Invalid parking status for manager parking", 400)
      }

      const result = await updateManagerParkingSlotStatus(
        parkingId,
        status,
        apartmentId
      )
      const message =
        status === "INACTIVE"
          ? "Parking slot deactivated successfully"
          : "Parking slot activated successfully"

      res.status(200).json({ success: true, message, data: result })
      return
    }

    const slot = await updateParkingSlotStatusService({
      apartmentId,
      userId,
      slotId: parkingId,
      status: status as VisitorParkingStatusUpdate,
      notes,
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
    const { apartmentId, userId } = getParkingContext(req)

    await assignParkingSlotService({
      apartmentId,
      userId,
      ...req.body,
    })

    const result = await listParkingSlotsService({ apartmentId })
    res.status(201).json({
      success: true,
      message: "Parking slot assigned successfully",
      data: result,
    })
  }
)

export const assignResidentParkingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const result = await assignResidentParking(
      getParkingId(req),
      req.body,
      apartmentId
    )

    res.status(200).json({
      success: true,
      message: "Resident parking assigned successfully",
      data: result,
    })
  }
)

export const releaseParkingSlot = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, userId } = getParkingContext(req)
    const slot = await releaseParkingSlotService({
      apartmentId,
      userId,
      slotId: getParkingId(req),
    })

    res.status(200).json({
      success: true,
      message: "Parking slot released successfully",
      data: slot,
    })
  }
)

export const releaseResidentParkingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getParkingContext(req)
    const result = await releaseResidentParking(getParkingId(req), apartmentId)

    res.status(200).json({
      success: true,
      message: "Parking slot released successfully",
      data: result,
    })
  }
)
