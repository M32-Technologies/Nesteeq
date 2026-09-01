import crypto from "crypto"

import {
  GuestPassModel,
  GuestPassStatus,
} from "../visitors/pass/pass.model.js"

import { VisitorVisitModel } from "../visitors/visit/visit.model.js"
import { VisitorVisitStatus } from "../visitors/visit/visit.interface.js"
import { SecurityDeliveryModel } from "../delivery/delivery.model.js"
import { DeliveryStatus } from "../delivery/delivery.interface.js"
import { VisitorParkingSlotModel } from "../parking/parking.model.js"
import { VisitorParkingSlotStatus } from "../parking/parking.interface.js"
import {
  EmergencyAlertModel,
  EmergencyAlertStatus,
} from "../alert/alert.model.js"
import {
  getApartmentFlatsService,
  getApartmentResidentsService,
} from "./security-directory.service.js"

import { AppError } from "../../utils/AppError.js"
import type {
  SecurityResidentsQuery,
  SecuritySummary,
  VerifyGuestPassInput,
} from "./security.interface.js"

export { getSecurityActivityService } from "./security-activity.service.js"

const hashToken = (token: string) =>
  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

export const verifyGuestPassService = async ({
  token,
  apartmentId,
}: VerifyGuestPassInput) => {
  const tokenHash = hashToken(token)

  const guestPass = await GuestPassModel.findOne({
    tokenHash,
    apartmentId,
  })
    .select("+tokenHash")
    .lean()

  if (!guestPass) {
    throw new AppError("Invalid guest pass", 404)
  }

  if (guestPass.status === GuestPassStatus.CANCELLED) {
    throw new AppError("Guest pass has been cancelled", 400)
  }

  if (guestPass.status === GuestPassStatus.USED) {
    throw new AppError("This guest pass has already been used", 409)
  }

  const now = new Date()

  if (
    guestPass.status === GuestPassStatus.EXPIRED ||
    guestPass.validUntil <= now
  ) {
    await GuestPassModel.updateOne(
      { _id: guestPass._id },
      { $set: { status: GuestPassStatus.EXPIRED } }
    )

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
      "This guest pass has already been used",
      409
    )
  }

  const {
    tokenHash: _tokenHash,
    ...safeGuestPass
  } = guestPass

  return safeGuestPass
}

export const getSecuritySummaryService = async (
  apartmentId: string
): Promise<SecuritySummary> => {
  const now = new Date()
  const { start, end } = getTodayRange()
  const usedPassIds = await VisitorVisitModel.distinct(
    "visitorPassId",
    {
      apartmentId,
      visitorPassId: {
        $ne: null,
      },
    }
  )

  const [
    visitorsInside,
    upcomingVisitors,
    deliveriesWaiting,
    availableVisitorParking,
    activeSosAlerts,
    reservedVisitorParking,
    occupiedVisitorParking,
    outOfServiceVisitorParking,
    upcomingVisitorsToday,
    checkedInToday,
    checkedOutToday,
  ] = await Promise.all([
    VisitorVisitModel.countDocuments({
      apartmentId,
      status: VisitorVisitStatus.ACTIVE,
    }),

    GuestPassModel.countDocuments({
      apartmentId,
      status: GuestPassStatus.ACTIVE,
      validUntil: {
        $gte: now,
      },
      _id: {
        $nin: usedPassIds,
      },
    }),

    SecurityDeliveryModel.countDocuments({
      apartmentId,
      status: DeliveryStatus.WAITING,
    }),

    VisitorParkingSlotModel.countDocuments({
      apartmentId,
      status: VisitorParkingSlotStatus.AVAILABLE,
    }),

    EmergencyAlertModel.countDocuments({
      apartmentId,
      status: EmergencyAlertStatus.ACTIVE,
    }),

    VisitorParkingSlotModel.countDocuments({
      apartmentId,
      status: VisitorParkingSlotStatus.RESERVED,
    }),

    VisitorParkingSlotModel.countDocuments({
      apartmentId,
      status: VisitorParkingSlotStatus.OCCUPIED,
    }),

    VisitorParkingSlotModel.countDocuments({
      apartmentId,
      status: VisitorParkingSlotStatus.OUT_OF_SERVICE,
    }),

    GuestPassModel.countDocuments({
      apartmentId,
      status: GuestPassStatus.ACTIVE,
      validFrom: {
        $lt: end,
      },
      validUntil: {
        $gte: now,
      },
      _id: {
        $nin: usedPassIds,
      },
    }),

    VisitorVisitModel.countDocuments({
      apartmentId,
      checkedInAt: {
        $gte: start,
        $lt: end,
      },
    }),

    VisitorVisitModel.countDocuments({
      apartmentId,
      status: VisitorVisitStatus.CHECKED_OUT,
      checkedOutAt: {
        $gte: start,
        $lt: end,
      },
    }),
  ])

  return {
    visitorsInside,
    upcomingVisitors,
    deliveriesWaiting,
    availableVisitorParking,
    activeSosAlerts,
    reservedVisitorParking,
    occupiedVisitorParking,
    outOfServiceVisitorParking,
    upcomingVisitorsToday,
    checkedInToday,
    checkedOutToday,
  }
}

export const getSecurityFlatsService = async (
  apartmentId: string
) => {
  return getApartmentFlatsService(apartmentId)
}

export const getSecurityResidentsService = async ({
  apartmentId,
  search,
  page,
  limit,
}: SecurityResidentsQuery) => {
  return getApartmentResidentsService({
    apartmentId,
    search,
    page,
    limit,
  })
}
