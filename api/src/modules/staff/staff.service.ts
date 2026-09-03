import { Types } from "mongoose"
import { AppError } from "../../utils/AppError.js"
import { getAuthDB } from "../../config/auth-db.js"
import { Staff, STAFF_ROLES } from "./staff.model.js"
import type { StaffListQuery } from "./staff.validation.js"

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const getStaff = async (
  query: StaffListQuery,
  apartmentId: string,
) => {
  if (!apartmentId) {
    throw new AppError("Apartment id is required", 400)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  const {
    page,
    limit,
    role,
    status,
  } = query
  const search = query.search?.trim() ?? ""
  const filter: Record<string, unknown> = {
    apartmentId: new Types.ObjectId(apartmentId),
  }

  if (role) {
    if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
      throw new AppError("Invalid staff role", 400)
    }

    filter.role = role
  }

  if (status) {
    if (status !== "active" && status !== "inactive") {
      throw new AppError("Status must be active or inactive", 400)
    }

    filter.status = status
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i")
    const users = await getAuthDB()
      .collection("user")
      .find({
        $or: [{ name: regex }, { email: regex }],
      })
      .project({ _id: 0, id: 1 })
      .toArray()

    filter.$or = [
      { phone: regex },
      { userId: { $in: users.map((user) => user.id).filter(Boolean) } },
    ]
  }

  const skip = (page - 1) * limit
  const [staff, totalCount] = await Promise.all([
    Staff.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    Staff.countDocuments(filter),
  ])

  const users = await getAuthDB()
    .collection("user")
    .find({
      id: { $in: staff.map((member) => member.userId).filter(Boolean) },
    })
    .project({
      _id: 0,
      id: 1,
      name: 1,
      email: 1,
      emailVerified: 1,
      image: 1,
      role: 1,
      phone: 1,
    })
    .toArray()

  const usersById = new Map(users.map((user) => [user.id, user]))

  return {
    staff: staff.map((member) => {
      const user = usersById.get(member.userId)

      return {
        id: member._id.toString(),
        apartmentId: member.apartmentId.toString(),
        userId: member.userId,
        name: user?.name ?? "Unknown user",
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        image: user?.image ?? null,
        role: member.role,
        maintenanceType: member.maintenanceType ?? null,
        phone: member.phone ?? user?.phone ?? null,
        status: member.status,
        joinedAt: member.joinedAt,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      }
    }),
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
  }
}

export const getStaffDetails = async (
  staffId: string,
  apartmentId: string,
) => {
  if (!apartmentId) {
    throw new AppError("Apartment id is required", 400)
  }

  if (!Types.ObjectId.isValid(staffId)) {
    throw new AppError("Staff id must be a valid id", 400)
  }

  const staff = await Staff.findOne({
    _id: new Types.ObjectId(staffId),
    apartmentId: new Types.ObjectId(apartmentId),
  }).lean()

  if (!staff) {
    throw new AppError("Staff not found", 404)
  }

  const user = await getAuthDB().collection("user").findOne(
    { id: staff.userId },
    {
      projection: {
        _id: 0,
        id: 1,
        name: 1,
        email: 1,
        emailVerified: 1,
        image: 1,
        role: 1,
        phone: 1,
      },
    },
  )

  return {
    id: staff._id.toString(),
    apartmentId: staff.apartmentId.toString(),
    userId: staff.userId,
    name: user?.name ?? "Unknown user",
    email: user?.email ?? null,
    emailVerified: user?.emailVerified ?? false,
    image: user?.image ?? null,
    role: staff.role,
    maintenanceType: staff.maintenanceType ?? null,
    phone: staff.phone ?? user?.phone ?? null,
    status: staff.status,
    joinedAt: staff.joinedAt,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  }
}

export const updateStaffStatus = async (
  staffId: string,
  apartmentId: string,
  status: unknown,
) => {
  if (!apartmentId) {
    throw new AppError("Apartment id is required", 400)
  }

  if (!Types.ObjectId.isValid(staffId)) {
    throw new AppError("Staff id must be a valid id", 400)
  }

  if (status !== "active" && status !== "inactive") {
    throw new AppError("Status must be active or inactive", 400)
  }

  const staff = await Staff.findOne({
    _id: new Types.ObjectId(staffId),
    apartmentId: new Types.ObjectId(apartmentId),
  })

  if (!staff) {
    throw new AppError("Staff not found", 404)
  }

  staff.status = status
  await staff.save()

  return {
    id: staff._id.toString(),
    status: staff.status,
    updatedAt: staff.updatedAt,
  }
}

export const updateStaffDetails = async (
  staffId: string,
  apartmentId: string,
  data: Record<string, unknown>,
) => {
  if (!apartmentId) {
    throw new AppError("Apartment id is required", 400)
  }

  if (!Types.ObjectId.isValid(staffId)) {
    throw new AppError("Staff id must be a valid id", 400)
  }

  if ("email" in data) {
    throw new AppError("Email cannot be changed", 400)
  }

  const staff = await Staff.findOne({
    _id: new Types.ObjectId(staffId),
    apartmentId: new Types.ObjectId(apartmentId),
  })
  
  if (!staff) {
    throw new AppError("Staff not found", 404)
  }

  if (data.role !== undefined) {
    if (
      typeof data.role !== "string" ||
      !STAFF_ROLES.includes(data.role as (typeof STAFF_ROLES)[number])
    ) {
      throw new AppError("Invalid staff role", 400)
    }

    staff.role = data.role as (typeof STAFF_ROLES)[number]
  }

  if (data.maintenanceType !== undefined) {
    const maintenanceType = data.maintenanceType

    if (maintenanceType !== null && typeof maintenanceType !== "string") {
      throw new AppError("Maintenance type must be a string or null", 400)
    }

    staff.maintenanceType =
      staff.role === "maintenance_technician"
        ? maintenanceType?.trim() || null
        : null
  } else if (staff.role !== "maintenance_technician") {
    staff.maintenanceType = null
  }

  if (data.phone !== undefined) {
    if (data.phone !== null && typeof data.phone !== "string") {
      throw new AppError("Phone must be a string or null", 400)
    }

    staff.phone = data.phone?.trim() || null
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) {
      throw new AppError("Name must contain at least 2 characters", 400)
    }

    await getAuthDB()
      .collection("user")
      .updateOne(
        { id: staff.userId },
        { $set: { name: data.name.trim() } },
      )
  }

  await staff.save()

  return getStaffDetails(staff._id.toString(), apartmentId)
}
