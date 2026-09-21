import type { Request, Response } from "express"

import { AppError } from "../../utils/AppError.js"
import { catchAsync } from "../../utils/catchAsync.js"

import {
  cancelGuestPassService,
  checkInVisitorService,
  checkoutVisitorService,
  createGuestPassService,
  createManualVisitorEntryService,
  getActiveVisitorsService,
  getGuestPassByIdService,
  getGuestPassesService,
  getVisitorRecordsService,
  getVisitorHistoryService,
} from "./visit.service.js"

const getSecurityContext = (req: Request) => {
  const userId = req.user?.id
  const apartmentId = req.user?.apartmentId

  if (!userId) throw new AppError("Unauthorized", 401)
  if (!apartmentId) throw new AppError("Apartment context not found", 403)

  return { userId, apartmentId }
}

const getQueryNumber = (value: unknown) =>
  typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value)
      : undefined

export const createGuestPass = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const result = await createGuestPassService({
      userId,
      flatId: req.body.flatId,
      visitorName: req.body.visitorName,
      visitorPhone: req.body.visitorPhone,
      purpose: req.body.purpose,
      vehicleNumber: req.body.vehicleNumber,
      validFrom: req.body.validFrom,
      validUntil: req.body.validUntil,
    })

    res.status(201).json({
      success: true,
      message: "Guest pass created successfully",
      data: result,
    })
  }
)

export const getGuestPasses = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined

    const result = await getGuestPassesService({
      userId,
      page: getQueryNumber(req.query.page),
      limit: getQueryNumber(req.query.limit),
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

export const getGuestPassById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    const guestPassId =
      typeof req.params.guestPassId === "string"
        ? req.params.guestPassId
        : undefined

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    if (!guestPassId) {
      throw new AppError("Invalid guest pass ID", 400)
    }

    const guestPass = await getGuestPassByIdService({
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

export const cancelGuestPass = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    const guestPassId =
      typeof req.params.guestPassId === "string"
        ? req.params.guestPassId
        : undefined

    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    if (!guestPassId) {
      throw new AppError("Invalid guest pass ID", 400)
    }

    const guestPass = await cancelGuestPassService({
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

export const checkInVisitor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)

    const visit = await checkInVisitorService({
      userId,
      apartmentId,
      visitorPassId: req.body.visitorPassId,
      token: req.body.token,
    })

    res.status(201).json({
      success: true,
      message: "Visitor checked in successfully",
      data: visit,
    })
  }
)

export const createManualVisitorEntry = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)

    const visit = await createManualVisitorEntryService({
      userId,
      apartmentId,
      ...req.body,
    })

    res.status(201).json({
      success: true,
      message: "Visitor registered and checked in successfully",
      data: visit,
    })
  }
)

export const checkoutVisitor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)

    const visitId =
      typeof req.params.visitId === "string"
        ? req.params.visitId
        : undefined

    if (!visitId) {
      throw new AppError("Invalid visitor visit ID", 400)
    }

    const visit = await checkoutVisitorService({
      userId,
      apartmentId,
      visitId,
    })

    res.status(200).json({
      success: true,
      message: "Visitor checked out successfully",
      data: visit,
    })
  }
)

export const getActiveVisitors = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const result = await getActiveVisitorsService({
      apartmentId,
      page: getQueryNumber(req.query.page),
      limit: getQueryNumber(req.query.limit),
    })

    res.status(200).json({
      success: true,
      message: "Active visitors fetched successfully",
      data: result,
    })
  }
)

export const getVisitorHistory = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const result = await getVisitorHistoryService({
      apartmentId,
      page: getQueryNumber(req.query.page),
      limit: getQueryNumber(req.query.limit),
    })

    res.status(200).json({
      success: true,
      message: "Visitor history fetched successfully",
      data: result,
    })
  }
)

export const getVisitorRecords = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId } = getSecurityContext(req)

    const result = await getVisitorRecordsService({
      apartmentId,
      page: getQueryNumber(req.query.page),
      limit: getQueryNumber(req.query.limit),
      status: req.query.status as
        | "ALL"
        | "UPCOMING"
        | "ACTIVE"
        | "EXITED"
        | undefined,
      entryType: req.query.entryType as
        | "ALL"
        | "PASS"
        | "MANUAL"
        | undefined,
      search: req.query.search as string | undefined,
    })

    res.status(200).json({
      success: true,
      message: "Visitor records fetched successfully",
      data: result,
    })
  }
)
