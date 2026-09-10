import { Types } from "mongoose"

import { getAuthDB } from "../../config/auth-db.js"
import { AppError } from "../../utils/AppError.js"
import { escapeRegExp } from "../../utils/regex.js"
import { Flat } from "../flat/flat.model.js"
import { ResidentModel } from "../resident/resident.model.js"
import type {
  BetterAuthUser,
  LeanFlat,
  LeanResident,
  ObjectIdLike,
  ResidentDirectoryRecord,
  ResidentSummary,
} from "./security.types.js"

const toId = (value: ObjectIdLike | string | null | undefined) =>
  value?.toString() ?? ""

export const getUserSummariesByIds = async (userIds: string[]) => {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter(Boolean))
  )
  const userObjectIds = uniqueUserIds
    .filter((userId) => Types.ObjectId.isValid(userId))
    .map((userId) => new Types.ObjectId(userId))

  if (uniqueUserIds.length === 0) {
    return new Map<string, BetterAuthUser>()
  }

  const users = await getAuthDB()
    .collection("user")
    .find({
      $or: [
        { id: { $in: uniqueUserIds } },
        ...(userObjectIds.length
          ? [{ _id: { $in: userObjectIds } }]
          : []),
      ],
    })
    .project({
      _id: 1,
      id: 1,
      name: 1,
      email: 1,
      phone: 1,
    })
    .toArray() as BetterAuthUser[]

  const usersById = new Map<string, BetterAuthUser>()

  for (const user of users) {
    if (user.id) usersById.set(user.id, user)
    if (user._id) usersById.set(toId(user._id), user)
  }

  return usersById
}

export const getApartmentFlatsService = async (
  apartmentId: string
) => {
  const [flats, residents] = await Promise.all([
    Flat.find({ apartmentId, status: "active" })
      .select("_id flatNumber occupancyStatus")
      .sort({ flatNumber: 1 })
      .lean(),

    ResidentModel.find({ apartmentId, status: "active" })
      .select("_id userId flatId residentType phoneNumber status")
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
      phone: resident.phoneNumber ?? user?.phone ?? null,
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

export const getMatchingUserIdsForSearch = async (search: string) => {
  const regex = new RegExp(escapeRegExp(search), "i")
  const users = await getAuthDB()
    .collection("user")
    .find({
      $or: [{ name: regex }, { email: regex }, { phone: regex }],
    })
    .project({
      _id: 1,
      id: 1,
    })
    .toArray() as Pick<BetterAuthUser, "_id" | "id">[]

  return users
    .flatMap((user) => [user.id, toId(user._id)])
    .filter(Boolean)
}

export const getMatchingFlatIdsForSearch = async (
  apartmentId: string,
  search: string
) => {
  const regex = new RegExp(escapeRegExp(search), "i")
  const flatIds = await Flat.distinct("_id", {
    apartmentId,
    status: "active",
    flatNumber: regex,
  })

  return flatIds
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
  const skip = (page - 1) * limit
  const activeFlatIds = await Flat.distinct("_id", {
    apartmentId,
    status: "active",
  })
  const filter: Record<string, unknown> = {
    apartmentId,
    status: "active",
    flatId: { $in: activeFlatIds },
  }
  const trimmedSearch = search?.trim()

  if (trimmedSearch) {
    const regex = new RegExp(escapeRegExp(trimmedSearch), "i")
    const [flatIds, userIds] = await Promise.all([
      getMatchingFlatIdsForSearch(apartmentId, trimmedSearch),
      getMatchingUserIdsForSearch(trimmedSearch),
    ])

    filter.$or = [
      { phoneNumber: regex },
      { residentType: regex },
      { status: regex },
      ...(flatIds.length ? [{ flatId: { $in: flatIds } }] : []),
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ]
  }

  const [residents, total] = await Promise.all([
    ResidentModel.find(filter)
      .select("_id userId apartmentId flatId residentType phoneNumber status joinedAt")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ResidentModel.countDocuments(filter),
  ])

  const residentRecords = residents as unknown as LeanResident[]
  const [usersById, flatRecords] = await Promise.all([
    getUserSummariesByIds(
      residentRecords.map((resident) => resident.userId)
    ),
    Flat.find({
      _id: {
        $in: residentRecords.map((resident) => resident.flatId),
      },
      apartmentId,
      status: "active",
    })
      .select("_id flatNumber occupancyStatus")
      .lean(),
  ])
  const flatsById = new Map(
    (flatRecords as unknown as LeanFlat[]).map((flat) => [
      toId(flat._id),
      flat,
    ])
  )
  const records = residentRecords.map<ResidentDirectoryRecord>(
    (resident) => {
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
        phone: resident.phoneNumber ?? user?.phone ?? null,
        residentType: resident.residentType,
        status: resident.status,
        joinedAt: resident.joinedAt ?? null,
      }
    }
  )
  const totalPages = Math.ceil(total / limit)

  return {
    residents: records,
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
    status: "active",
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
    status: "active",
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
