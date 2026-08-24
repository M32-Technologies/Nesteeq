// invitation.model.ts

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose"
import { INVITE_ROLES, INVITE_STATUSES } from "./invitation.types.js"

const inviteSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: null,
      trim: true,
    },
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: INVITE_ROLES,
      required: true,
      index: true,
    },
    maintenanceType: {
      type: String,
      default: null,
      trim: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },  
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: INVITE_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
    invitedBy: {
      type: String,
      required: true,
      index: true,
    },
    acceptedBy: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)
inviteSchema.index(
  {
    apartmentId: 1,
    email: 1,
    role: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
    },
  }
)
inviteSchema.index({
  apartmentId: 1,
  flatId: 1,
  status: 1,
})

inviteSchema.index({
  apartmentId: 1,
  status: 1,
  createdAt: -1,
})

export type InviteEntity = InferSchemaType<typeof inviteSchema>
export type InviteDocument = HydratedDocument<InviteEntity>

export const Invite = model("Invite", inviteSchema)
