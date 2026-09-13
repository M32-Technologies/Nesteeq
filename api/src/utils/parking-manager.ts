import mongoose, { Types } from "mongoose"

import { Apartment } from "../modules/apartment/apartment.model.js"
import {
  ensureFlatInApartment,
  ensureResidentInApartment,
} from "./security/directory.js"
import {
  ParkingSlotStatus,
  ParkingUsageType,
  type GeneratedParkingSlotResponse,
  type ParkingSlotStatus as ParkingSlotStatusType,
} from "../modules/parking/parking.interface.js"
import { ParkingSlotModel } from "../modules/parking/parking.model.js"
import type {
  AssignResidentParkingInput,
  GetParkingSlotsQuery,
  ManagerGenerateParkingSlotsInput,
  UpdateParkingSlotInput,
} from "../modules/parking/parking.schema.js"
import { AppError } from "./AppError.js"
import { escapeRegExp } from "./regex.js"
import {
  buildParkingPrefix,
  generateParkingZoneCode,
  isDuplicateKeyError,
  normalizeText,
  normalizeVehicleNumber,
  parkingObjectId,
} from "./parking.js"

const getParkingIds = (parkingId: string, apartmentId?: string) => ({
  apartmentObjectId: parkingObjectId(apartmentId, "apartment id"),
  parkingObjectId: parkingObjectId(parkingId, "parking id"),
})

const managerStatusSet = new Set<string>(
  Object.values(ParkingSlotStatus)
)

export const generateParkingSlots = async (
  apartmentId: string,
  data: ManagerGenerateParkingSlotsInput
): Promise<GeneratedParkingSlotResponse> => {
  const apartmentObjectId = parkingObjectId(apartmentId, "apartment id")
  const session = await mongoose.startSession()

  try {
    let result: GeneratedParkingSlotResponse | undefined

    await session.withTransaction(async () => {
      const apartment = await Apartment.findById(apartmentObjectId)
        .select("parkingSlots")
        .session(session)
        .lean()

      if (!apartment) throw new AppError("Apartment not found", 404)

      const currentCount = await ParkingSlotModel.countDocuments({
        apartmentId: apartmentObjectId,
      }).session(session)
      const maxCapacity = Number(apartment.parkingSlots || 0)
      const remainingSlots = maxCapacity - currentCount

      if (maxCapacity && data.numberOfSlots > remainingSlots) {
        throw new AppError(
          `Only ${remainingSlots} parking slots can be generated. ` +
            `${currentCount} of ${maxCapacity} parking slots already exist.`,
          400
        )
      }

      const level = data.level.trim()
      const zoneName = normalizeText(data.zoneName)
      const zoneCode = generateParkingZoneCode(zoneName)
      const prefix = buildParkingPrefix({
        level,
        zoneName,
        vehicleType: data.vehicleType,
      })
      const existingSlots = await ParkingSlotModel.find({
        apartmentId: apartmentObjectId,
        prefix,
      })
        .select("slotNumber")
        .session(session)
        .lean()

      const nextNumber =
        existingSlots.reduce((max, slot) => {
          const match = slot.slotNumber.match(/(\d+)$/)
          const number = match ? Number(match[1]) : 0
          return number > max ? number : max
        }, 0) + 1

      const slotsToGenerate = Array.from(
        { length: data.numberOfSlots },
        (_, index) => ({
          apartmentId: apartmentObjectId,
          level,
          zoneName,
          zoneCode,
          prefix,
          slotNumber: `${prefix}-${String(nextNumber + index).padStart(3, "0")}`,
          vehicleType: data.vehicleType,
          usageType: data.usageType,
          status: ParkingSlotStatus.AVAILABLE,
          flatId: null,
          residentId: null,
          visitorId: null,
          vehicleNumber: null,
          assignedAt: null,
        })
      )
      const insertedSlots = await ParkingSlotModel.insertMany(
        slotsToGenerate,
        { session, ordered: true }
      )

      result = {
        totalSlotsGenerated: insertedSlots.length,
        level,
        zoneName,
        zoneCode,
        prefix,
        generatedSlots: insertedSlots.map((slot) => ({
          id: slot._id.toString(),
          slotNumber: slot.slotNumber,
          level: slot.level,
          zoneName: slot.zoneName ?? null,
          zoneCode: slot.zoneCode ?? null,
          prefix: slot.prefix,
          vehicleType: slot.vehicleType,
          usageType: slot.usageType,
          status: slot.status,
        })),
      }
    })

    if (!result) throw new AppError("Failed to generate parking slots", 500)
    return result
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "One or more parking slots already exist. Please try again.",
        409
      )
    }
    throw error
  } finally {
    await session.endSession()
  }
}

export const getParkingSlots = async (
  query: GetParkingSlotsQuery,
  apartmentId: string
) => {
  const apartmentObjectId = parkingObjectId(apartmentId, "apartment id")
  const filter: Record<string, unknown> = { apartmentId: apartmentObjectId }

  if (query.vehicleType) filter.vehicleType = query.vehicleType
  if (query.usageType) filter.usageType = query.usageType
  if (query.status && query.status !== "ALL" && managerStatusSet.has(query.status)) {
    filter.status = query.status
  }
  if (query.level) filter.level = query.level
  if (query.zoneCode) filter.zoneCode = query.zoneCode
  if (query.search) {
    const regex = new RegExp(escapeRegExp(query.search.trim()), "i")
    filter.$or = [{ slotNumber: regex }, { vehicleNumber: regex }]
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const skip = (page - 1) * limit
  const sortDirection: 1 | -1 = query.sortOrder === "desc" ? -1 : 1
  const sortField = query.sortBy === "createdAt" ? "createdAt" : "slotNumber"
  const sortOptions: Record<string, 1 | -1> =
    sortField === "slotNumber"
      ? { slotNumber: sortDirection, createdAt: -1 }
      : { [sortField]: sortDirection, slotNumber: 1 }

  const [parkingSlots, total] = await Promise.all([
    ParkingSlotModel.find(filter)
      .populate("flatId", "_id flatNumber")
      .populate("residentId", "_id userId phoneNumber residentType")
      .collation({ locale: "en", numericOrdering: true })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    ParkingSlotModel.countDocuments(filter),
  ])

  return {
    parkingSlots,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export const getParkingSlotById = async (
  parkingId: string,
  apartmentId: string
) => {
  const { apartmentObjectId, parkingObjectId } = getParkingIds(
    parkingId,
    apartmentId
  )
  const slot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  })
    .populate("flatId", "_id flatNumber")
    .populate("residentId", "_id userId phoneNumber residentType")
    .lean()

  if (!slot) throw new AppError("Parking slot not found", 404)
  return slot
}

export const updateParkingSlot = async (
  parkingId: string,
  data: UpdateParkingSlotInput,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  })

  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.status === "ASSIGNED" || slot.status === "OCCUPIED") {
    throw new AppError(
      "Parking slot must be released before changing parking configuration",
      400
    )
  }

  const updateData: Record<string, unknown> = {}
  if (data.level !== undefined) updateData.level = data.level.trim()
  if (data.zoneName !== undefined) updateData.zoneName = normalizeText(data.zoneName)
  if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
  if (data.usageType !== undefined) updateData.usageType = data.usageType
  if (!Object.keys(updateData).length) {
    throw new AppError("No parking slot fields provided for update", 400)
  }

  const updated = await ParkingSlotModel.findOneAndUpdate(
    { _id: parkingObjectId, apartmentId: apartmentObjectId },
    { $set: updateData },
    { returnDocument: "after", runValidators: true }
  ).lean()

  if (!updated) throw new AppError("Parking slot not found", 404)
  return updated
}

export const assignResidentParking = async (
  parkingId: string,
  data: AssignResidentParkingInput,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId } = getParkingIds(parkingId, apartmentId)
  await ensureFlatInApartment({ apartmentId: apartmentId!, flatId: data.flatId })

  if (data.residentId) {
    await ensureResidentInApartment({
      apartmentId: apartmentId!,
      residentId: data.residentId,
      flatId: data.flatId,
    })
  }

  const updated = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: parkingObjectId,
      apartmentId: apartmentObjectId,
      usageType: ParkingUsageType.RESIDENT,
      status: ParkingSlotStatus.AVAILABLE,
    },
    {
      $set: {
        status: ParkingSlotStatus.ASSIGNED,
        flatId: new Types.ObjectId(data.flatId),
        residentId: data.residentId ? new Types.ObjectId(data.residentId) : null,
        vehicleNumber: normalizeVehicleNumber(data.vehicleNumber),
        assignedAt: new Date(),
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean()

  if (updated) return updated

  const slot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT) {
    throw new AppError("Visitor parking cannot be assigned as resident parking", 400)
  }
  throw new AppError("Parking slot is not available", 409)
}

export const releaseResidentParking = async (
  parkingId: string,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId } = getParkingIds(parkingId, apartmentId)
  const released = await ParkingSlotModel.findOneAndUpdate(
    {
      _id: parkingObjectId,
      apartmentId: apartmentObjectId,
      usageType: ParkingUsageType.RESIDENT,
      status: ParkingSlotStatus.ASSIGNED,
    },
    {
      $set: {
        status: ParkingSlotStatus.AVAILABLE,
        flatId: null,
        residentId: null,
        visitorId: null,
        vehicleNumber: null,
        assignedAt: null,
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean()

  if (released) return released

  const slot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  }).lean()
  if (!slot) throw new AppError("Parking slot not found", 404)
  if (slot.usageType !== ParkingUsageType.RESIDENT) {
    throw new AppError(
      "Visitor parking cannot be released using the resident parking release API",
      400
    )
  }
  if (slot.status === ParkingSlotStatus.AVAILABLE) {
    throw new AppError("Parking slot is already available", 409)
  }
  throw new AppError("Only assigned parking slots can be released", 400)
}

export const updateParkingSlotStatus = async (
  parkingId: string,
  status: Extract<ParkingSlotStatusType, "AVAILABLE" | "INACTIVE">,
  apartmentId?: string
) => {
  const { apartmentObjectId, parkingObjectId } = getParkingIds(parkingId, apartmentId)
  const slot = await ParkingSlotModel.findOne({
    _id: parkingObjectId,
    apartmentId: apartmentObjectId,
  })

  if (!slot) throw new AppError("Parking slot not found", 404)
  if (status === ParkingSlotStatus.INACTIVE) {
    if (slot.status !== ParkingSlotStatus.AVAILABLE) {
      throw new AppError("Only available parking slots can be deactivated", 409)
    }
  } else if (slot.status !== ParkingSlotStatus.INACTIVE) {
    throw new AppError("Only inactive parking slots can be activated", 400)
  }

  const updated = await ParkingSlotModel.findOneAndUpdate(
    { _id: parkingObjectId, apartmentId: apartmentObjectId, status: slot.status },
    { $set: { status } },
    { returnDocument: "after", runValidators: true }
  ).lean()
  if (!updated) throw new AppError("Parking slot status has already changed", 409)
  return updated
}

export const getParkingStats = async (apartmentId: string) => {
  const apartmentObjectId = parkingObjectId(apartmentId, "apartment id")
  const base = { apartmentId: apartmentObjectId }
  const [total, available, assigned, occupied, inactive, residentSlots, visitorSlots] =
    await Promise.all([
      ParkingSlotModel.countDocuments(base),
      ParkingSlotModel.countDocuments({ ...base, status: ParkingSlotStatus.AVAILABLE }),
      ParkingSlotModel.countDocuments({ ...base, status: ParkingSlotStatus.ASSIGNED }),
      ParkingSlotModel.countDocuments({ ...base, status: ParkingSlotStatus.OCCUPIED }),
      ParkingSlotModel.countDocuments({ ...base, status: ParkingSlotStatus.INACTIVE }),
      ParkingSlotModel.countDocuments({ ...base, usageType: ParkingUsageType.RESIDENT }),
      ParkingSlotModel.countDocuments({ ...base, usageType: ParkingUsageType.VISITOR }),
    ])

  return { total, available, assigned, occupied, inactive, residentSlots, visitorSlots }
}
