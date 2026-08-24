import {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose"

export const STAFF_ROLES = [
  "property_manager",
  "treasurer",
  "facility_manager",
  "security_staff",
  "maintenance_technician",
] as const

const staffSchema = new Schema(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    /**
     * Better Auth user ID.
     */
    userId: {
      type: String,
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: STAFF_ROLES,
      required: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

/**
 * A user can only have one staff membership
 * inside the same apartment.
 */
staffSchema.index(
  {
    apartmentId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
)

/**
 * Useful for:
 * - getting all staff in an apartment
 * - filtering staff by role
 * - filtering active/inactive staff
 */
staffSchema.index({
  apartmentId: 1,
  role: 1,
  status: 1,
})

export type StaffDocument = InferSchemaType<typeof staffSchema>

export const Staff = model("Staff", staffSchema)