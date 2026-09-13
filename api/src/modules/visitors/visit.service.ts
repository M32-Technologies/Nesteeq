import { Flat } from "../flat/flat.model.js"
import { normalizeVehicleNumber } from "../parking/parking.service.js"
import {
  hashGuestPassToken,
  parseGuestPassQrPayload,
} from "../../utils/visitors/token.js"
import {
  GuestPassModel,
  GuestPassStatus,
  VisitorEntryType,
  VisitorVisitModel,
  VisitorVisitStatus,
} from "./visit.model.js"
import type {
  CheckInVisitorInput,
  CheckoutVisitorInput,
  ListVisitsInput,
  ManualVisitorEntryInput,
} from "./visit.types.js"

import { AppError } from "../../utils/AppError.js"
import { buildManualVisitorDuplicateFilter } from "../../utils/visitors/manual-visitor-duplicate.js"
import { releaseActiveParkingForVisit } from "../../utils/visitors/parking-release.js"
import { getVisitorVisitsPage } from "../../utils/visitors/visit-list-query.js"

export {
  cancelGuestPassService,
  createGuestPassService,
  getGuestPassByIdService,
  getGuestPassesService,
} from "../../utils/visitors/guest-pass.js"
export { getVisitorRecordsService } from "../../utils/visitors/visit-records-query.js"

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
