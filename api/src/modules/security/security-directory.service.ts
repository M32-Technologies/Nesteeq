import { Types } from "mongoose"

import { getAuthDB } from "../../config/auth-db.js"
import { AppError } from "../../utils/AppError.js"
import { Flat } from "../flat/flat.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import type {
  BetterAuthUser,
  LeanFlat,
  LeanResident,
  ObjectIdLike,
  ResidentDirectoryRecord,
  ResidentSummary,
} from "./security.interface.js"

const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

export const getUserSummariesByIds = async (userIds: string[]) => {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter(Boolean))
  )

  if (uniqueUserIds.length === 0) {
    return new Map<string, BetterAuthUser>()
  }

  const users = await getAuthDB()
    .collection<BetterAuthUser>("user")
    .find({
      id: {
        $in: uniqueUserIds,
      },
    })
    .project<BetterAuthUser>({
      id: 1,
      name: 1,
      email: 1,
      phone: 1,
    })
    .toArray()

  return new Map(users.map((user) => [user.id, user]))
}

export const getApartmentFlatsService = async (
  apartmentId: string
) => {
  const [flats, residents] = await Promise.all([
    Flat.find({ apartmentId })
      .select("_id flatNumber occupancyStatus")
      .sort({ flatNumber: 1 })
      .lean(),

    ResidentModel.find({ apartmentId })
      .select("_id userId flatId residentType phone status")
      .sort({ joinedAt: -1 })
      .lean(),
  ])

  const flatRecords = flats as unknown as LeanFlat[]
  const residentRecords = residents as unknown as LeanResident[]
  const usersById = await getUserSummariesByIds(
    residentRecords.map((resident) => resident.userId)
  )

  const residentsByFlat = new Map<string, ResidentSummary[]>()

  for (const resident of residentRecords) {
    const flatId = toId(resident.flatId)
    const user = usersById.get(resident.userId)

    const summary: ResidentSummary = {
      _id: toId(resident._id),
      userId: resident.userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      phone: resident.phone ?? user?.phone ?? null,
      residentType: resident.residentType,
      status: resident.status,
    }

    residentsByFlat.set(flatId, [
      ...(residentsByFlat.get(flatId) ?? []),
      summary,
    ])
  }

  return {
    flats: flatRecords.map((flat) => ({
      _id: toId(flat._id),
      flatNumber: flat.flatNumber,
      occupancyStatus: flat.occupancyStatus ?? null,
      residents: residentsByFlat.get(toId(flat._id)) ?? [],
    })),
  }
}

export const getApartmentResidentsService = async ({
  apartmentId,
  search,
  page = 1,
  limit = 20,
}: {
  apartmentId: string
  search?: string
  page?: number
  limit?: number
}) => {
  const [flats, residents] = await Promise.all([
    Flat.find({ apartmentId })
      .select("_id flatNumber occupancyStatus")
      .sort({ flatNumber: 1 })
      .lean(),

    ResidentModel.find({ apartmentId })
      .select("_id userId apartmentId flatId residentType phone status joinedAt")
      .sort({ joinedAt: -1 })
      .lean(),
  ])

  const flatRecords = flats as unknown as LeanFlat[]
  const residentRecords = residents as unknown as LeanResident[]
  const usersById = await getUserSummariesByIds(
    residentRecords.map((resident) => resident.userId)
  )
  const flatsById = new Map(
    flatRecords.map((flat) => [toId(flat._id), flat])
  )

  const query = search?.trim().toLowerCase() ?? ""

  const records = residentRecords
    .map<ResidentDirectoryRecord>((resident) => {
      const user = usersById.get(resident.userId)
      const flatId = toId(resident.flatId)
      const flat = flatsById.get(flatId)

      return {
        _id: toId(resident._id),
        userId: resident.userId,
        apartmentId: toId(resident.apartmentId),
        flatId,
        flatNumber: flat?.flatNumber ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
        phone: resident.phone ?? user?.phone ?? null,
        residentType: resident.residentType,
        status: resident.status,
        joinedAt: resident.joinedAt ?? null,
      }
    })
    .filter((resident) => {
      if (!query) return true

      return [
        resident.name,
        resident.email,
        resident.phone,
        resident.flatNumber,
        resident.residentType,
        resident.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    })

  const total = records.length
  const totalPages = Math.ceil(total / limit)
  const skip = (page - 1) * limit

  return {
    residents: records.slice(skip, skip + limit),
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

export const ensureFlatInApartment = async ({
  apartmentId,
  flatId,
}: {
  apartmentId: string
  flatId: string
}) => {
  if (!Types.ObjectId.isValid(flatId)) {
    throw new AppError("Invalid flat ID", 400)
  }

  const flat = await Flat.findOne({
    _id: flatId,
    apartmentId,
  }).lean()

  if (!flat) {
    throw new AppError("Flat not found in this apartment", 404)
  }

  return flat as unknown as LeanFlat
}

export const ensureResidentInApartment = async ({
  apartmentId,
  residentId,
  flatId,
}: {
  apartmentId: string
  residentId: string
  flatId?: string
}) => {
  if (!Types.ObjectId.isValid(residentId)) {
    throw new AppError("Invalid resident ID", 400)
  }

  const filter: Record<string, unknown> = {
    _id: residentId,
    apartmentId,
  }

  if (flatId) {
    filter.flatId = flatId
  }

  const resident = await ResidentModel.findOne(filter).lean()

  if (!resident) {
    throw new AppError("Resident not found in this apartment", 404)
  }

  return resident as unknown as LeanResident
}
