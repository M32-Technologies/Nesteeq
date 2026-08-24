import mongoose, { Types } from "mongoose"
import { Invite } from "./invitation.model.js"
import { Resident } from "../resident/resident.model.js"
import { Staff } from "../staff/staff.model.js"
import { Flat } from "../flat/flat.model.js"
import {
  type CreateResidentInviteInput,
  type CreateStaffInviteInput,
  type GetInvitationsQuery,
} from "./invitation.validation.js"
import {
  INVITE_MANAGEMENT_ROLES,
  RESIDENT_INVITE_ROLES,
  STAFF_INVITE_ROLES,
  type AcceptInvitationUser,
  type InvitationFilter,
  type InviteManagementRole,
  type InviteRole,
  type InviteStatus,
  type ResidentInviteRole,
  type StaffInviteRole,
} from "./invitation.types.js"
import { generateInviteToken, hashToken } from "../../utils/genrateInviteToken.js"
import { emailService } from "../../services/EmailService.js"
import { env } from "../../config/env.js"
import { AppError } from "../../utils/AppError.js"
import { getAuthDB } from "../../config/auth-db.js"

const INVITE_EXPIRY_DAYS = 7

export const createResidentInvite = async (
  data: CreateResidentInviteInput,
  apartmentId: string,
  invitedBy: string,
  inviterRole?: string | null,
) => {
  if (
    !inviterRole ||
    !INVITE_MANAGEMENT_ROLES.includes(inviterRole as InviteManagementRole)
  ) {
    throw new AppError("You do not have permission to manage invitations", 403)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  if (!Types.ObjectId.isValid(data.flatId)) {
    throw new AppError("Flat id must be a valid id", 400)
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId)
  const flatObjectId = new Types.ObjectId(data.flatId)
  const email = data.email.trim().toLowerCase()

  if (!RESIDENT_INVITE_ROLES.includes(data.role as ResidentInviteRole)) {
    throw new AppError("Invalid resident role", 400)
  }

  const flat = await Flat.findOne({
    _id: flatObjectId,
    apartmentId: apartmentObjectId,
  })
    .select("_id flatNumber")
    .lean()

  if (!flat) {
    throw new AppError("Flat not found in this apartment", 404)
  }

  const existingUser = await getAuthDB()
    .collection<{ id?: string }>("user")
    .findOne({ email }, { projection: { _id: 0, id: 1 } })

  if (existingUser?.id) {
    const existingResident = await Resident.exists({
      apartmentId: apartmentObjectId,
      userId: existingUser.id,
      status: "active",
    })

    if (existingResident) {
      throw new AppError(
        "This user already has an active resident membership",
        409,
      )
    }
  }

  const pendingInvite = await Invite.exists({
    apartmentId: apartmentObjectId,
    email,
    role: data.role,
    status: "pending",
  })

  if (pendingInvite) {
    throw new AppError("An invitation is already pending for this email", 409)
  }

  const { rawToken, tokenHash } = generateInviteToken()
  const invite = await Invite.create({
    email,
    fullName: data.fullName.trim(),
    phoneNumber: data.phoneNumber ?? null,
    apartmentId: apartmentObjectId,
    flatId: flat._id,
    role: data.role,
    tokenHash,
    status: "pending",
    invitedBy,
    expiresAt: new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  })

  await emailService.sendResidentInvite(email, {
    name: invite.fullName,
    apartmentName: "your apartment community",
    inviteLink: `${env.webUrl}/accept-invite?token=${encodeURIComponent(
      rawToken,
    )}`,
  })

  return {
    id: invite._id.toString(),
    email: invite.email,
    fullName: invite.fullName,
    phoneNumber: invite.phoneNumber,
    role: invite.role,
    flatId: invite.flatId?.toString(),
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  }
}

export const createStaffInvite = async (
  data: CreateStaffInviteInput,
  apartmentId: string,
  invitedBy: string,
  inviterRole?: string | null,
) => {
  if (
    !inviterRole ||
    !INVITE_MANAGEMENT_ROLES.includes(inviterRole as InviteManagementRole)
  ) {
    throw new AppError("You do not have permission to manage invitations", 403)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId)
  const email = data.email.trim().toLowerCase()

  if (!STAFF_INVITE_ROLES.includes(data.role as StaffInviteRole)) {
    throw new AppError("Invalid staff role", 400)
  }

  const existingUser = await getAuthDB()
    .collection<{ id?: string }>("user")
    .findOne({ email }, { projection: { _id: 0, id: 1 } })

  if (existingUser?.id) {
    const existingStaff = await Staff.exists({
      apartmentId: apartmentObjectId,
      userId: existingUser.id,
      status: "active",
    })

    if (existingStaff) {
      throw new AppError("This user already has an active staff membership", 409)
    }
  }

  const pendingInvite = await Invite.exists({
    apartmentId: apartmentObjectId,
    email,
    role: data.role,
    status: "pending",
  })

  if (pendingInvite) {
    throw new AppError("An invitation is already pending for this email", 409)
  }

  const { rawToken, tokenHash } = generateInviteToken()
  const invite = await Invite.create({
    email,
    fullName: data.fullName.trim(),
    phoneNumber: data.phoneNumber ?? null,
    apartmentId: apartmentObjectId,
    flatId: null,
    role: data.role,
    tokenHash,
    status: "pending",
    invitedBy,
    expiresAt: new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  })

  await emailService.sendResidentInvite(email, {
    name: invite.fullName,
    apartmentName: "your apartment community",
    inviteLink: `${env.webUrl}/accept-invite?token=${encodeURIComponent(
      rawToken,
    )}`,
  })

  return {
    id: invite._id.toString(),
    email: invite.email,
    fullName: invite.fullName,
    phoneNumber: invite.phoneNumber,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  }
}

export const getInvitations = async (
  query: GetInvitationsQuery,
  apartmentId: string,
  managerRole?: string | null,
) => {
  if (
    !managerRole ||
    !INVITE_MANAGEMENT_ROLES.includes(managerRole as InviteManagementRole)
  ) {
    throw new AppError("You do not have permission to manage invitations", 403)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  const apartmentObjectId = new Types.ObjectId(apartmentId)
  const now = new Date()
  const filter: InvitationFilter = { apartmentId: apartmentObjectId }

  if (query.status === "pending") {
    filter.status = "pending"
    filter.expiresAt = { $gt: now }
  } else if (query.status === "expired") {
    filter.$or = [
      { status: "expired" },
      { status: "pending", expiresAt: { $lte: now } },
    ]
  } else if (query.status) {
    filter.status = query.status
  }

  if (query.role) {
    filter.role = query.role
  }

  if (query.search) {
    filter.$and = [
      {
        $or: [
          { email: { $regex: query.search, $options: "i" } },
          { fullName: { $regex: query.search, $options: "i" } },
        ],
      },
    ]
  }

  const skip = (query.page - 1) * query.limit
  const [invitations, totalCount] = await Promise.all([
    Invite.find(filter)
      .select("-tokenHash -invitedBy")
      .populate("flatId", "flatNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Invite.countDocuments(filter),
  ])

  return {
    invitations: invitations.map((invite) => ({
      ...invite,
      status:
        invite.status === "pending" && invite.expiresAt <= now
          ? "expired"
          : invite.status,
    })),
    page: query.page,
    limit: query.limit,
    totalCount,
    totalPages: Math.ceil(totalCount / query.limit),
  }
}

export const validateInvitation = async (rawToken: string) => {
  if (!rawToken?.trim()) {
    throw new AppError("Invitation token is required", 400)
  }

  const invite = await Invite.findOne({ tokenHash: hashToken(rawToken) })

  if (!invite) {
    throw new AppError("Invitation not found", 404)
  }

  if (invite.status === "accepted") {
    throw new AppError("Invitation has already been accepted", 409)
  }

  if (invite.status === "revoked") {
    throw new AppError("Invitation has been revoked", 410)
  }

  if (invite.expiresAt <= new Date()) {
    if (invite.status !== "expired") {
      invite.status = "expired"
      await invite.save()
    }

    throw new AppError("Invitation has expired", 410)
  }

  const flat =
    invite.flatId
      ? await Flat.findOne({
          _id: invite.flatId,
          apartmentId: invite.apartmentId,
        })
          .select("_id flatNumber")
          .lean()
      : null

  return {
    id: invite._id.toString(),
    email: invite.email,
    fullName: invite.fullName,
    role: invite.role,
    apartment: {
      id: invite.apartmentId.toString(),
    },
    flat: flat
      ? {
          id: flat._id.toString(),
          flatNumber: flat.flatNumber,
        }
      : null,
    expiresAt: invite.expiresAt,
  }
}

export const acceptInvitation = async (
  rawToken: string,
  authenticatedUser: AcceptInvitationUser,
) => {
  if (!authenticatedUser.emailVerified) {
    throw new AppError("Verified email is required to accept this invitation", 403)
  }

  if (!rawToken?.trim()) {
    throw new AppError("Invitation token is required", 400)
  }

  const tokenHash = hashToken(rawToken)
  const userEmail = authenticatedUser.email.trim().toLowerCase()
  const existingInvite = await Invite.findOne({ tokenHash })

  if (!existingInvite) {
    throw new AppError("Invitation not found", 404)
  }

  if (existingInvite.email.trim().toLowerCase() !== userEmail) {
    throw new AppError("This invitation belongs to another email address", 403)
  }

  if (
    existingInvite.status === "accepted" &&
    existingInvite.acceptedBy === authenticatedUser.id
  ) {
    return {
      role: existingInvite.role as InviteRole,
      apartmentId: existingInvite.apartmentId.toString(),
      flatId: existingInvite.flatId?.toString(),
      status: "accepted" as const,
    }
  }

  const result = await mongoose.connection.transaction(async (session) => {
    const invite = await Invite.findOne({ tokenHash }).session(session)

    if (!invite) {
      throw new AppError("Invitation not found", 404)
    }

    if (invite.email.trim().toLowerCase() !== userEmail) {
      throw new AppError("This invitation belongs to another email address", 403)
    }

    if (invite.status === "accepted") {
      if (invite.acceptedBy === authenticatedUser.id) {
        return {
          role: invite.role as InviteRole,
          apartmentId: invite.apartmentId.toString(),
          flatId: invite.flatId?.toString(),
          status: "accepted" as const,
        }
      }

      throw new AppError("Invitation has already been accepted", 409)
    }

    if (invite.status === "revoked") {
      throw new AppError("Invitation has been revoked", 410)
    }

    if (invite.expiresAt <= new Date()) {
      invite.status = "expired"
      await invite.save({ session })
      throw new AppError("Invitation has expired", 410)
    }

    if (RESIDENT_INVITE_ROLES.includes(invite.role as ResidentInviteRole)) {
      const residentType = invite.role as ResidentInviteRole

      if (!invite.flatId) {
        throw new AppError("Resident invitation does not contain a flat", 400)
      }

      const flat = await Flat.findOne({
        _id: invite.flatId,
        apartmentId: invite.apartmentId,
      })
        .session(session)
        .select("_id")
        .lean()

      if (!flat) {
        throw new AppError("Flat no longer exists in this apartment", 404)
      }

      const existingResident = await Resident.exists({
        apartmentId: invite.apartmentId,
        userId: authenticatedUser.id,
      }).session(session)

      if (existingResident) {
        throw new AppError(
          "You already have a resident membership in this apartment",
          409,
        )
      }

      await Resident.create(
        [
          {
            apartmentId: invite.apartmentId,
            userId: authenticatedUser.id,
            flatId: flat._id,
            residentType,
            phoneNumber: invite.phoneNumber,
            status: "active",
            joinedAt: new Date(),
          },
        ],
        { session },
      )
    } else if (STAFF_INVITE_ROLES.includes(invite.role as StaffInviteRole)) {
      const staffRole = invite.role as StaffInviteRole

      const existingStaff = await Staff.exists({
        apartmentId: invite.apartmentId,
        userId: authenticatedUser.id,
      }).session(session)

      if (existingStaff) {
        throw new AppError(
          "You already have a staff membership in this apartment",
          409,
        )
      }

      await Staff.create(
        [
          {
            apartmentId: invite.apartmentId,
            userId: authenticatedUser.id,
            role: staffRole,
            phone: invite.phoneNumber,
            status: "active",
            joinedAt: new Date(),
          },
        ],
        { session },
      )
    } else {
      throw new AppError("Invalid invitation role", 400)
    }

    const authDb = mongoose.connection.getClient().db()

    await authDb.collection("user").updateOne(
      { id: authenticatedUser.id },
      invite.flatId
        ? {
            $set: {
              role: invite.role,
              apartmentId: invite.apartmentId.toString(),
              flatId: invite.flatId.toString(),
              phone: invite.phoneNumber ?? null,
            },
          }
        : {
            $set: {
              role: invite.role,
              apartmentId: invite.apartmentId.toString(),
              phone: invite.phoneNumber ?? null,
            },
            $unset: {
              flatId: "",
            },
          },
      { session },
    )

    invite.status = "accepted"
    invite.acceptedAt = new Date()
    invite.acceptedBy = authenticatedUser.id
    await invite.save({ session })

    return {
      role: invite.role as InviteRole,
      apartmentId: invite.apartmentId.toString(),
      flatId: invite.flatId?.toString(),
      status: "accepted" as const,
    }
  })

  return result
}

export const resendInvitation = async (
  invitationId: string,
  apartmentId: string,
  managerRole?: string | null,
) => {
  if (
    !managerRole ||
    !INVITE_MANAGEMENT_ROLES.includes(managerRole as InviteManagementRole)
  ) {
    throw new AppError("You do not have permission to manage invitations", 403)
  }

  if (!Types.ObjectId.isValid(invitationId)) {
    throw new AppError("Invitation id must be a valid id", 400)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  const invite = await Invite.findOne({
    _id: new Types.ObjectId(invitationId),
    apartmentId: new Types.ObjectId(apartmentId),
  })

  if (!invite) {
    throw new AppError("Invitation not found", 404)
  }

  if (invite.status === "accepted") {
    throw new AppError("Accepted invitations cannot be resent", 409)
  }

  if (invite.status === "revoked") {
    throw new AppError("Revoked invitations cannot be resent", 409)
  }

  const { rawToken, tokenHash } = generateInviteToken()

  invite.tokenHash = tokenHash
  invite.expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  )
  invite.status = "pending"
  invite.revokedAt = null
  await invite.save()

  await emailService.sendResidentInvite(invite.email, {
    name: invite.fullName,
    apartmentName: "your apartment community",
    inviteLink: `${env.webUrl}/accept-invite?token=${encodeURIComponent(
      rawToken,
    )}`,
  })

  return {
    id: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
  }
}

export const revokeInvitation = async (
  invitationId: string,
  apartmentId: string,
  managerRole?: string | null,
) => {
  if (
    !managerRole ||
    !INVITE_MANAGEMENT_ROLES.includes(managerRole as InviteManagementRole)
  ) {
    throw new AppError("You do not have permission to manage invitations", 403)
  }

  if (!Types.ObjectId.isValid(invitationId)) {
    throw new AppError("Invitation id must be a valid id", 400)
  }

  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Apartment id must be a valid id", 400)
  }

  const invite = await Invite.findOne({
    _id: new Types.ObjectId(invitationId),
    apartmentId: new Types.ObjectId(apartmentId),
  })

  if (!invite) {
    throw new AppError("Invitation not found", 404)
  }

  if (invite.expiresAt <= new Date() && invite.status === "pending") {
    invite.status = "expired"
    await invite.save()
    throw new AppError("Invitation has already expired", 410)
  }

  if (invite.status !== "pending") {
    throw new AppError("Only pending invitations can be revoked", 409)
  }

  invite.status = "revoked"
  invite.revokedAt = new Date()
  await invite.save()

  return {
    id: invite._id.toString(),
    status: invite.status as InviteStatus,
    revokedAt: invite.revokedAt,
  }
}
