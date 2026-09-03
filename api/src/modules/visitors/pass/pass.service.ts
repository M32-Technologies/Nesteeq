import crypto from "crypto"

import { Flat } from "../../flat/flat.model.js"
import { ResidentModel } from "../../resident/resident.model.js"

import {
  GuestPassModel,
  GuestPassStatus,
  type GuestPassStatus as GuestPassStatusType,
} from "./pass.model.js"

import { AppError } from "../../../utils/AppError.js"

interface CreateGuestPassInput {
  userId: string
  flatId: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  vehicleNumber?: string
  validFrom: Date
  validUntil: Date
}

interface ListGuestPassesInput {
  userId: string
  page?: number
  limit?: number
  status?: GuestPassStatusType
}

interface GuestPassByIdInput {
  userId: string
  guestPassId: string
}

interface CancelGuestPassInput {
  userId: string
  guestPassId: string
}

/**
 * Find the active Resident record connected to
 * the authenticated Better Auth user.
 */
const getActiveResidentByUserId = async (userId: string) => {
  const resident = await ResidentModel.findOne({
    userId,
    status: "active",
  })

  if (!resident) {
    throw new AppError(
      "Active resident profile not found",
      404
    )
  }

  return resident
}

/**
 * Automatically mark expired ACTIVE guest passes
 * as EXPIRED.
 */
const expireOldGuestPasses = async (
  apartmentId: unknown,
  residentId: unknown
) => {
  await GuestPassModel.updateMany(
    {
      apartmentId,
      createdByResidentId: residentId,
      status: GuestPassStatus.ACTIVE,
      validUntil: {
        $lt: new Date(),
      },
    },
    {
      $set: {
        status: GuestPassStatus.EXPIRED,
      },
    }
  )
}

/**
 * Generate a secure random token for the QR code.
 *
 * The raw token is returned to the frontend once.
 * Only its SHA-256 hash is stored in MongoDB.
 */
const generateGuestPassToken = () => {
  const rawToken = crypto
    .randomBytes(32)
    .toString("hex")

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex")

  return {
    rawToken,
    tokenHash,
  }
}

/**
 * Create a new Guest Pass.
 */
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
  const resident =
    await getActiveResidentByUserId(userId)

  /*
   * A resident must only create passes
   * for their assigned flat.
   */
  if (resident.flatId.toString() !== flatId) {
    throw new AppError(
      "You are not authorized to create a guest pass for this flat",
      403
    )
  }

  /*
   * Verify that the flat actually exists
   * inside the resident's apartment.
   */
  const flat = await Flat.findOne({
    _id: flatId,
    apartmentId: resident.apartmentId,
  })

  if (!flat) {
    throw new AppError(
      "Flat not found in your apartment",
      404
    )
  }

  const now = new Date()

  /*
   * Defense-in-depth validation.
   * Zod already checks these values, but critical
   * business rules should also exist in the service.
   */
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

  const { rawToken, tokenHash } =
    generateGuestPassToken()

  const guestPass = await GuestPassModel.create({
    apartmentId: resident.apartmentId,

    createdByResidentId: resident._id,

    flatId: flat._id,

    visitorName,

    visitorPhone: visitorPhone || null,

    purpose: purpose || null,

    vehicleNumber: vehicleNumber
      ? vehicleNumber.toUpperCase()
      : null,

    tokenHash,

    validFrom,

    validUntil,

    status: GuestPassStatus.ACTIVE,
  })

  /*
   * tokenHash exists on the freshly created document,
   * even though select:false prevents it from appearing
   * in normal queries.
   *
   * Never send the hash to the frontend.
   */
  const {
    tokenHash: _tokenHash,
    ...safeGuestPass
  } = guestPass.toObject()

  return {
    guestPass: safeGuestPass,

    /*
     * The frontend uses this value to create the QR.
     * It should not be stored client-side permanently.
     */
    token: rawToken,
  }
}

/**
 * Get Guest Passes created by the current resident.
 */
export const getGuestPassesService = async ({
  userId,
  page = 1,
  limit = 10,
  status,
}: ListGuestPassesInput) => {
  const resident =
    await getActiveResidentByUserId(userId)

  /*
   * Before listing passes, update any passes
   * whose validUntil time has already passed.
   */
  await expireOldGuestPasses(
    resident.apartmentId,
    resident._id
  )

  const filter: {
    apartmentId: typeof resident.apartmentId
    createdByResidentId: typeof resident._id
    status?: GuestPassStatusType
  } = {
    apartmentId: resident.apartmentId,
    createdByResidentId: resident._id,
  }

  if (status) {
    filter.status = status
  }

  const skip = (page - 1) * limit

  const [guestPasses, total] =
    await Promise.all([
      GuestPassModel.find(filter)
        .sort({
          createdAt: -1,
        })
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

/**
 * Get one Guest Pass created by the
 * authenticated resident.
 */
export const getGuestPassByIdService = async ({
  userId,
  guestPassId,
}: GuestPassByIdInput) => {
  const resident =
    await getActiveResidentByUserId(userId)

  await expireOldGuestPasses(
    resident.apartmentId,
    resident._id
  )

  const guestPass = await GuestPassModel.findOne({
    _id: guestPassId,

    apartmentId: resident.apartmentId,

    createdByResidentId: resident._id,
  }).lean()

  if (!guestPass) {
    throw new AppError(
      "Guest pass not found",
      404
    )
  }

  return guestPass
}

/**
 * Cancel a Guest Pass.
 */
export const cancelGuestPassService = async ({
  userId,
  guestPassId,
}: CancelGuestPassInput) => {
  const resident =
    await getActiveResidentByUserId(userId)

  await expireOldGuestPasses(
    resident.apartmentId,
    resident._id
  )

  const guestPass = await GuestPassModel.findOne({
    _id: guestPassId,

    apartmentId: resident.apartmentId,

    createdByResidentId: resident._id,
  })

  if (!guestPass) {
    throw new AppError(
      "Guest pass not found",
      404
    )
  }

  if (
    guestPass.status ===
    GuestPassStatus.CANCELLED
  ) {
    throw new AppError(
      "Guest pass is already cancelled",
      400
    )
  }

  if (
    guestPass.status ===
    GuestPassStatus.EXPIRED
  ) {
    throw new AppError(
      "Expired guest passes cannot be cancelled",
      400
    )
  }

  if (
    guestPass.status ===
    GuestPassStatus.USED
  ) {
    throw new AppError(
      "Used guest passes cannot be cancelled",
      400
    )
  }

  guestPass.status =
    GuestPassStatus.CANCELLED

  await guestPass.save()

  return guestPass
}
