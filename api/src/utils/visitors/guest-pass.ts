import crypto from "crypto"
import QRCode from "qrcode"

import { Flat } from "../../modules/flat/flat.model.js"
import { normalizeVehicleNumber } from "../../modules/parking/parking.service.js"
import { ResidentModel } from "../../modules/resident/resident.model.js"
import {
  GuestPassModel,
  GuestPassStatus,
  type GuestPassStatus as GuestPassStatusType,
} from "../../modules/visitors/visit.model.js"
import type {
  CancelGuestPassInput,
  CreateGuestPassInput,
  GuestPassByIdInput,
  ListGuestPassesInput,
} from "../../modules/visitors/visit.types.js"
import { AppError } from "../AppError.js"
import { hashGuestPassToken } from "./token.js"

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
