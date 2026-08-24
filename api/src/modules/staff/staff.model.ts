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

    maintenanceType: {
      type: String,
      default: null,
      trim: true,
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
staffSchema.index(
  {
    apartmentId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
)

staffSchema.index({
  apartmentId: 1,
  role: 1,
  status: 1,
})

export type StaffDocument = InferSchemaType<typeof staffSchema>

export const Staff = model("Staff", staffSchema)
