import { Flat } from "../../flat/flat.model.js"

import {
  GuestPassModel,
  GuestPassStatus,
} from "../pass/pass.model.js"

import {
  VisitorEntryType,
  VisitorVisitStatus,
} from "./visit.interface.js"

import { VisitorVisitModel } from "./visit.model.js"

import { AppError } from "../../../utils/AppError.js"
import { buildManualVisitorDuplicateFilter } from "./manual-visitor-duplicate.js"

export { getVisitorRecordsService } from "./visit-records.service.js"

interface CheckInVisitorInput {
  apartmentId: string
  userId: string
  visitorPassId: string
}

interface ManualVisitorEntryInput {
  apartmentId: string
  userId: string
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
}

interface CheckoutVisitorInput {
  apartmentId: string
  userId: string
  visitId: string
}

interface ListVisitsInput {
  apartmentId: string
  page?: number
  limit?: number
}

export const checkInVisitorService = async ({
  apartmentId,
  userId,
  visitorPassId,
}: CheckInVisitorInput) => {
  const guestPass = await GuestPassModel.findOne({
    _id: visitorPassId,
    apartmentId,
  })

  if (!guestPass) {
    throw new AppError("Guest pass not found", 404)
  }

  const now = new Date()

  if (guestPass.status === GuestPassStatus.CANCELLED) {
    throw new AppError("Guest pass has been cancelled", 400)
  }

  if (guestPass.status === GuestPassStatus.USED) {
    throw new AppError("This guest pass has already been used", 409)
  }

  if (
    guestPass.status === GuestPassStatus.EXPIRED ||
    guestPass.validUntil <= now
  ) {
    if (guestPass.status !== GuestPassStatus.EXPIRED) {
      guestPass.status = GuestPassStatus.EXPIRED
      await guestPass.save()
    }

    throw new AppError("Guest pass has expired", 400)
  }

  if (guestPass.validFrom > now) {
    throw new AppError("Guest pass is not valid yet", 400)
  }

  if (guestPass.status !== GuestPassStatus.ACTIVE) {
    throw new AppError("Guest pass is not active", 400)
  }

  const existingVisit = await VisitorVisitModel.findOne({
    visitorPassId: guestPass._id,
  }).lean()

  if (existingVisit) {
    throw new AppError(
      "This guest pass has already been used for check-in",
      409
    )
  }

  const claimedPass = await GuestPassModel.findOneAndUpdate(
    {
      _id: guestPass._id,
      apartmentId,
      status: GuestPassStatus.ACTIVE,
    },
    {
      $set: {
        status: GuestPassStatus.USED,
        usedAt: now,
        usedBy: userId,
      },
    },
    {
      new: true,
    }
  )

  if (!claimedPass) {
    throw new AppError("This guest pass has already been used", 409)
  }

  try {
    const visit = await VisitorVisitModel.create({
      apartmentId: claimedPass.apartmentId,
      flatId: claimedPass.flatId,
      visitorPassId: claimedPass._id,

      visitorName: claimedPass.visitorName,
      visitorPhone: claimedPass.visitorPhone ?? null,
      purpose: claimedPass.purpose ?? null,
      vehicleNumber: claimedPass.vehicleNumber ?? null,

      entryType: VisitorEntryType.PASS,

      checkedInBy: userId,
      checkedInAt: now,

      checkedOutBy: null,
      checkedOutAt: null,

      status: VisitorVisitStatus.ACTIVE,
    })

    return visit
  } catch (error: unknown) {
    await GuestPassModel.updateOne(
      {
        _id: claimedPass._id,
        status: GuestPassStatus.USED,
        usedBy: userId,
      },
      {
        $set: {
          status: GuestPassStatus.ACTIVE,
        },
        $unset: {
          usedAt: "",
          usedBy: "",
        },
      }
    )

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "This guest pass has already been used for check-in",
        409
      )
    }

    throw error
  }
}

export const createManualVisitorEntryService = async ({
  apartmentId,
  userId,
  flatId,
  visitorName,
  visitorPhone,
  purpose,
  vehicleNumber,
}: ManualVisitorEntryInput) => {
  const flat = await Flat.findOne({
    _id: flatId,
    apartmentId,
  }).lean()

  if (!flat) {
    throw new AppError(
      "Flat not found in this apartment",
      404
    )
  }

  const duplicateEntry = await VisitorVisitModel.findOne(
    buildManualVisitorDuplicateFilter({
      apartmentId,
      flatId,
      visitorName,
      visitorPhone,
      vehicleNumber,
    })
  )
    .select("_id")
    .lean()

  if (duplicateEntry) {
    throw new AppError(
      "A matching active or recent visitor entry already exists.",
      409
    )
  }

  const visit = await VisitorVisitModel.create({
    apartmentId,
    flatId,

    visitorPassId: null,

    visitorName,
    visitorPhone: visitorPhone || null,
    purpose: purpose || null,
    vehicleNumber: vehicleNumber
      ? vehicleNumber.toUpperCase()
      : null,

    entryType: VisitorEntryType.MANUAL,

    checkedInBy: userId,
    checkedInAt: new Date(),

    checkedOutBy: null,
    checkedOutAt: null,

    status: VisitorVisitStatus.ACTIVE,
  })

  return visit
}

export const checkoutVisitorService = async ({
  apartmentId,
  userId,
  visitId,
}: CheckoutVisitorInput) => {
  const visit = await VisitorVisitModel.findOne({
    _id: visitId,
    apartmentId,
  })

  if (!visit) {
    throw new AppError("Visitor visit not found", 404)
  }

  if (visit.status === VisitorVisitStatus.CHECKED_OUT) {
    throw new AppError(
      "Visitor is already checked out",
      400
    )
  }

  visit.status = VisitorVisitStatus.CHECKED_OUT
  visit.checkedOutBy = userId
  visit.checkedOutAt = new Date()

  await visit.save()

  return visit
}

export const getActiveVisitorsService = async ({
  apartmentId,
  page = 1,
  limit = 10,
}: ListVisitsInput) => {
  const skip = (page - 1) * limit

  const filter = {
    apartmentId,
    status: VisitorVisitStatus.ACTIVE,
  }

  const [visitors, total] = await Promise.all([
    VisitorVisitModel.find(filter)
      .sort({ checkedInAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    VisitorVisitModel.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    visitors,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const getVisitorHistoryService = async ({
  apartmentId,
  page = 1,
  limit = 10,
}: ListVisitsInput) => {
  const skip = (page - 1) * limit

  const filter = {
    apartmentId,
  }

  const [visits, total] = await Promise.all([
    VisitorVisitModel.find(filter)
      .sort({ checkedInAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    VisitorVisitModel.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    visits,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}
