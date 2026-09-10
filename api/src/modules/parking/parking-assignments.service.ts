import { Types } from "mongoose"

import { AppError } from "../../utils/AppError.js"
import { ensureFlatInApartment } from "../security/security-directory.service.js"
import {
  VisitorVisitModel,
  VisitorVisitStatus,
} from "../visitors/visit/visit.model.js"
import { ensureVisitorParkingSlotAvailable } from "./parking-availability.js"
import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
} from "./parking.interface.js"
import { VisitorParkingAssignmentModel, VisitorParkingSlotModel } from "./parking.model.js"
import {
  duplicateKeyPatternIncludes,
  enrichSlots,
  isDuplicateKeyError,
  normalizeText,
  toId,
  type LeanParkingAssignment,
  type LeanParkingSlot,
  type LinkedVisitorVisit,
} from "./parking-shared.js"

const assertParkingSlotId = (slotId: string) => {
  if (!Types.ObjectId.isValid(slotId)) {
    throw new AppError("Invalid parking slot ID", 400)
  }
}

const getLinkedVisitorVisit = async ({
  apartmentId,
  flatId,
  visitorVisitId,
}: {
  apartmentId: string
  flatId: string
  visitorVisitId?: string
}) => {
  if (!visitorVisitId) return null

  if (!Types.ObjectId.isValid(visitorVisitId)) {
    throw new AppError("Invalid visitor visit ID", 400)
  }

  const linkedVisitorVisit = (await VisitorVisitModel.findOne({
    _id: visitorVisitId,
    apartmentId,
    status: VisitorVisitStatus.ACTIVE,
  })
    .select("_id flatId visitorPassId visitorName vehicleNumber")
    .lean()) as LinkedVisitorVisit | null

  if (!linkedVisitorVisit) {
    throw new AppError("Selected visitor is not currently checked in", 400)
  }

  if (toId(linkedVisitorVisit.flatId) !== flatId) {
    throw new AppError(
      "Selected visitor does not match the selected flat",
      400
    )
  }

  return linkedVisitorVisit
}

const rollbackClaimedSlot = async (
  apartmentId: string,
  slotId: string
) => {
  await VisitorParkingSlotModel.updateOne(
    {
      _id: slotId,
      apartmentId,
      status: VisitorParkingSlotStatus.OCCUPIED,
    },
    { $set: { status: VisitorParkingSlotStatus.AVAILABLE } }
  )
}

export const assignParkingSlotService = async ({
  apartmentId,
  userId,
  slotId,
  flatId,
  visitorVisitId,
  visitorName,
  vehicleNumber,
  vehicleType,
  notes,
}: {
  apartmentId: string
  userId: string
  slotId: string
  flatId: string
  visitorVisitId?: string
  visitorName: string
  vehicleNumber: string
  vehicleType?: string
  notes?: string
}) => {
  assertParkingSlotId(slotId)

  await ensureFlatInApartment({ apartmentId, flatId })

  const linkedVisitorVisit = await getLinkedVisitorVisit({
    apartmentId,
    flatId,
    visitorVisitId,
  })
  const visitorVisitObjectId = linkedVisitorVisit
    ? new Types.ObjectId(toId(linkedVisitorVisit._id))
    : null
  const guestPassObjectId = linkedVisitorVisit?.visitorPassId
    ? new Types.ObjectId(toId(linkedVisitorVisit.visitorPassId))
    : null

  const slot = await VisitorParkingSlotModel.findOne({
    _id: slotId,
    apartmentId,
  }).lean<LeanParkingSlot | null>()

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  ensureVisitorParkingSlotAvailable(slot.status)

  if (visitorVisitObjectId) {
    const activeVisitorAssignment =
      await VisitorParkingAssignmentModel.exists({
        apartmentId,
        visitorVisitId: visitorVisitObjectId,
        status: VisitorParkingAssignmentStatus.ACTIVE,
      })

    if (activeVisitorAssignment) {
      throw new AppError(
        "Selected visitor already has an active parking assignment",
        409
      )
    }
  }

  const claimedSlot = await VisitorParkingSlotModel.findOneAndUpdate(
    {
      _id: slotId,
      apartmentId,
      status: VisitorParkingSlotStatus.AVAILABLE,
    },
    { $set: { status: VisitorParkingSlotStatus.OCCUPIED } },
    { new: true }
  ).lean<LeanParkingSlot | null>()

  if (!claimedSlot) {
    throw new AppError("Parking slot is no longer available", 409)
  }

  try {
    const assignment = await VisitorParkingAssignmentModel.create({
      apartmentId,
      slotId,
      flatId,
      visitorVisitId: visitorVisitObjectId,
      guestPassId: guestPassObjectId,
      visitorName: linkedVisitorVisit?.visitorName ?? visitorName,
      vehicleNumber: (
        linkedVisitorVisit?.vehicleNumber ?? vehicleNumber
      ).toUpperCase(),
      vehicleType: normalizeText(vehicleType),
      notes: normalizeText(notes),
      status: VisitorParkingAssignmentStatus.ACTIVE,
      assignedBy: userId,
      assignedAt: new Date(),
    })

    return assignment.toObject() as LeanParkingAssignment
  } catch (error: unknown) {
    await rollbackClaimedSlot(apartmentId, slotId)

    if (isDuplicateKeyError(error)) {
      if (duplicateKeyPatternIncludes(error, "visitorVisitId")) {
        throw new AppError(
          "Selected visitor already has an active parking assignment",
          409
        )
      }

      throw new AppError("Parking slot already has an active assignment", 409)
    }

    throw error
  }
}

export const releaseParkingSlotService = async ({
  apartmentId,
  userId,
  slotId,
}: {
  apartmentId: string
  userId: string
  slotId: string
}) => {
  assertParkingSlotId(slotId)

  const slotExists = await VisitorParkingSlotModel.exists({
    _id: slotId,
    apartmentId,
  })

  if (!slotExists) {
    throw new AppError("Parking slot not found", 404)
  }

  const assignment = await VisitorParkingAssignmentModel.findOneAndUpdate(
    {
      apartmentId,
      slotId,
      status: VisitorParkingAssignmentStatus.ACTIVE,
    },
    {
      $set: {
        status: VisitorParkingAssignmentStatus.RELEASED,
        releasedBy: userId,
        releasedAt: new Date(),
      },
    },
    { new: true }
  )

  if (!assignment) {
    throw new AppError("No active parking assignment found", 404)
  }

  const slot = await VisitorParkingSlotModel.findOneAndUpdate(
    { _id: slotId, apartmentId },
    { $set: { status: VisitorParkingSlotStatus.AVAILABLE } },
    { new: true }
  ).lean<LeanParkingSlot | null>()

  if (!slot) {
    throw new AppError("Parking slot not found", 404)
  }

  const records = await enrichSlots(apartmentId, [slot])

  return records[0]
}
