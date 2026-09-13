import crypto from "crypto"
import QRCode from "qrcode"

import { Flat } from "../flat/flat.model.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
} from "../parking/parking.interface.js"
import {
  VisitorParkingAssignmentModel,
  VisitorParkingSlotModel,
} from "../parking/parking.model.js"
import { normalizeVehicleNumber } from "../parking/parking.service.js"
import { ResidentModel } from "../resident/resident.model.js"
import {
  hashGuestPassToken,
  parseGuestPassQrPayload,
} from "./visit-token.js"
import {
  GuestPassModel,
  GuestPassStatus,
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
  type GuestPassStatus as GuestPassStatusType,
} from "./visit.model.js"
import type {
  CancelGuestPassInput,
  CheckInVisitorInput,
  CheckoutVisitorInput,
  CreateGuestPassInput,
  GuestPassByIdInput,
  ListGuestPassesInput,
  ListVisitsInput,
  ManualVisitorEntryInput,
} from "./visit.types.js"

import { AppError } from "../../utils/AppError.js"
import { buildManualVisitorDuplicateFilter } from "./manual-visitor-duplicate.js"
import { getVisitorVisitsPage } from "./visit-list-query.js"

export { getVisitorRecordsService } from "./visit-records-query.js"

const getActiveResidentByUserId = async (userId: string) => {
  const resident = await ResidentModel.findOne({
    userId,
    status: "active",
  })

  if (!resident) {
    throw new AppError("Active resident profile not found", 404)
  }

  return resident
}

const expireOldGuestPasses = async (
  apartmentId: unknown,
  residentId: unknown
) => {
  await GuestPassModel.updateMany(
    {
      apartmentId,
      createdByResidentId: residentId,
      status: GuestPassStatus.ACTIVE,
      validUntil: { $lt: new Date() },
    },
    {
      $set: { status: GuestPassStatus.EXPIRED },
    }
  )
}

const generateGuestPassToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashGuestPassToken(rawToken)

  return { rawToken, tokenHash }
}

type ReleasedParkingAssignment = {
  assignmentId: string
  slotId: string
}

const releaseActiveParkingForVisit = async ({
  apartmentId,
  userId,
  visitId,
  releasedAt,
}: {
  apartmentId: string
  userId: string
  visitId: string
  releasedAt: Date
}): Promise<ReleasedParkingAssignment | null> => {
  const assignment =
    await VisitorParkingAssignmentModel.findOneAndUpdate(
      {
        apartmentId,
        visitorVisitId: visitId,
        status: VisitorParkingAssignmentStatus.ACTIVE,
      },
      {
        $set: {
          status: VisitorParkingAssignmentStatus.RELEASED,
          releasedBy: userId,
          releasedAt,
        },
      },
      { new: true }
    )

  if (!assignment) return null

  const slotUpdate = await VisitorParkingSlotModel.updateOne(
    {
      _id: assignment.slotId,
      apartmentId,
    },
    {
      $set: {
        status: VisitorParkingSlotStatus.AVAILABLE,
      },
    }
  )

  if (slotUpdate.matchedCount === 0) {
    await VisitorParkingAssignmentModel.updateOne(
      {
        _id: assignment._id,
        apartmentId,
      },
      {
        $set: {
          status: VisitorParkingAssignmentStatus.ACTIVE,
          releasedBy: null,
          releasedAt: null,
        },
      }
    )

    throw new AppError(
      "Unable to release visitor parking slot",
      500
    )
  }

  return {
    assignmentId: assignment._id.toString(),
    slotId: assignment.slotId.toString(),
  }
}

export const createGuestPassService = async ({
  userId,
  flatId,
  visitorName,
  visitorPhone,
  purpose,
  vehicleNumber,
  validFrom,
  validUntil,
}: CreateGuestPassInput) => {
  const resident = await getActiveResidentByUserId(userId)
  const normalizedVehicleNumber = vehicleNumber
    ? normalizeVehicleNumber(vehicleNumber)
    : null

  if (resident.flatId.toString() !== flatId) {
    throw new AppError(
      "You are not authorized to create a guest pass for this flat",
      403
    )
  }

  const flat = await Flat.findOne({
    _id: flatId,
    apartmentId: resident.apartmentId,
  })

  if (!flat) {
    throw new AppError("Flat not found in your apartment", 404)
  }

  const now = new Date()

  if (validUntil <= validFrom) {
    throw new AppError(
      "Guest pass end time must be later than start time",
      400
    )
  }

  if (validUntil <= now) {
    throw new AppError(
      "Guest pass end time must be in the future",
      400
    )
  }

  const { rawToken, tokenHash } = generateGuestPassToken()
  const qrCodeDataUrl = await QRCode.toDataURL(rawToken, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "M",
  })

  const guestPass = await GuestPassModel.create({
    apartmentId: resident.apartmentId,
    createdByResidentId: resident._id,
    flatId: flat._id,
    visitorName,
    visitorPhone: visitorPhone || null,
    purpose: purpose || null,
    vehicleNumber: normalizedVehicleNumber,
    tokenHash,
    validFrom,
    validUntil,
    status: GuestPassStatus.ACTIVE,
  })

  const { tokenHash: _tokenHash, ...safeGuestPass } =
    guestPass.toObject()

  return {
    guestPass: safeGuestPass,
    token: rawToken,
    qrCodeDataUrl,
  }
}

export const getGuestPassesService = async ({
  userId,
  page = 1,
  limit = 10,
  status,
}: ListGuestPassesInput) => {
  const resident = await getActiveResidentByUserId(userId)

  await expireOldGuestPasses(resident.apartmentId, resident._id)

  const filter: {
    apartmentId: typeof resident.apartmentId
    createdByResidentId: typeof resident._id
    status?: GuestPassStatusType
  } = {
    apartmentId: resident.apartmentId,
    createdByResidentId: resident._id,
  }

  if (status) filter.status = status

  const skip = (page - 1) * limit
  const [guestPasses, total] = await Promise.all([
    GuestPassModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GuestPassModel.countDocuments(filter),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    guestPasses,
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

export const getGuestPassByIdService = async ({
  userId,
  guestPassId,
}: GuestPassByIdInput) => {
  const resident = await getActiveResidentByUserId(userId)

  await expireOldGuestPasses(resident.apartmentId, resident._id)

  const guestPass = await GuestPassModel.findOne({
    _id: guestPassId,
    apartmentId: resident.apartmentId,
    createdByResidentId: resident._id,
  }).lean()

  if (!guestPass) {
    throw new AppError("Guest pass not found", 404)
  }

  return guestPass
}

export const cancelGuestPassService = async ({
  userId,
  guestPassId,
}: CancelGuestPassInput) => {
  const resident = await getActiveResidentByUserId(userId)

  await expireOldGuestPasses(resident.apartmentId, resident._id)

  const guestPass = await GuestPassModel.findOne({
    _id: guestPassId,
    apartmentId: resident.apartmentId,
    createdByResidentId: resident._id,
  })

  if (!guestPass) {
    throw new AppError("Guest pass not found", 404)
  }

  if (guestPass.status === GuestPassStatus.CANCELLED) {
    throw new AppError("Guest pass is already cancelled", 400)
  }

  if (guestPass.status === GuestPassStatus.EXPIRED) {
    throw new AppError(
      "Expired guest passes cannot be cancelled",
      400
    )
  }

  if (guestPass.status === GuestPassStatus.USED) {
    throw new AppError("Used guest passes cannot be cancelled", 400)
  }

  guestPass.status = GuestPassStatus.CANCELLED

  await guestPass.save()

  return guestPass
}

export const checkInVisitorService = async ({
  apartmentId,
  userId,
  visitorPassId,
  token,
}: CheckInVisitorInput) => {
  const tokenHash = token
    ? hashGuestPassToken(parseGuestPassQrPayload(token))
    : null
  const guestPassFilter = tokenHash
    ? {
        tokenHash,
        apartmentId,
      }
    : {
        _id: visitorPassId,
        apartmentId,
      }

  const guestPass = await GuestPassModel.findOne({
    ...guestPassFilter,
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
      ...(tokenHash ? { tokenHash } : {}),
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
  vehicleType,
}: ManualVisitorEntryInput) => {
  const normalizedVehicleNumber = vehicleNumber
    ? normalizeVehicleNumber(vehicleNumber)
    : null
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
      vehicleNumber: normalizedVehicleNumber,
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
    vehicleNumber: normalizedVehicleNumber,
    vehicleType: vehicleType || null,

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

  const checkedOutAt = new Date()

  const checkedOutVisit =
    await VisitorVisitModel.findOneAndUpdate(
      {
        _id: visitId,
        apartmentId,
        status: VisitorVisitStatus.ACTIVE,
      },
      {
        $set: {
          status: VisitorVisitStatus.CHECKED_OUT,
          checkedOutBy: userId,
          checkedOutAt,
        },
      },
      { new: true }
    )

  if (!checkedOutVisit) {
    throw new AppError(
      "Visitor is already checked out",
      400
    )
  }

  try {
    await releaseActiveParkingForVisit({
      apartmentId,
      userId,
      visitId,
      releasedAt: checkedOutAt,
    })
  } catch (error) {
    await VisitorVisitModel.updateOne(
      {
        _id: visitId,
        apartmentId,
        checkedOutAt,
      },
      {
        $set: {
          status: VisitorVisitStatus.ACTIVE,
          checkedOutBy: null,
          checkedOutAt: null,
        },
      }
    )

    throw error
  }

  return checkedOutVisit
}

export const getActiveVisitorsService = async ({
  apartmentId,
  page = 1,
  limit = 10,
}: ListVisitsInput) => {
  const result = await getVisitorVisitsPage({
    apartmentId,
    page,
    limit,
    status: VisitorVisitStatus.ACTIVE,
    includeFlatId: true,
  })

  return {
    visitors: result.data,
    pagination: result.pagination,
  }
}

export const getVisitorHistoryService = async ({
  apartmentId,
  page = 1,
  limit = 10,
}: ListVisitsInput) => {
  const result = await getVisitorVisitsPage({
    apartmentId,
    page,
    limit,
  })

  return {
    visits: result.data,
    pagination: result.pagination,
  }
}
