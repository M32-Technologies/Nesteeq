import type { Request, Response } from "express"

import { AppError } from "../../../utils/AppError.js"
import { catchAsync } from "../../../utils/catchAsync.js"

import {
  checkInVisitorService,
  checkoutVisitorService,
  createManualVisitorEntryService,
  getActiveVisitorsService,
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

export const checkInVisitor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, apartmentId } = getSecurityContext(req)

    const visit = await checkInVisitorService({
      userId,
      apartmentId,
      visitorPassId: req.body.visitorPassId,
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
