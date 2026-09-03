import mongoose, {
  Schema,
  type Model,
  type Types,
} from "mongoose"

export const EmergencyAlertType = {
  SOS: "SOS",
  MEDICAL: "MEDICAL",
  FIRE: "FIRE",
  SECURITY: "SECURITY",
  OTHER: "OTHER",
} as const

export type EmergencyAlertType =
  (typeof EmergencyAlertType)[keyof typeof EmergencyAlertType]

export const EmergencyAlertStatus = {
  ACTIVE: "ACTIVE",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESPONDING: "RESPONDING",
  RESOLVED: "RESOLVED",
} as const

export type EmergencyAlertStatus =
  (typeof EmergencyAlertStatus)[keyof typeof EmergencyAlertStatus]

export interface IEmergencyAlert {
  apartmentId: Types.ObjectId
  residentId: Types.ObjectId
  flatId: Types.ObjectId
  alertType: EmergencyAlertType
  message?: string | null
  status: EmergencyAlertStatus
  triggeredBy: string
  triggeredAt: Date
  acknowledgedBy?: string | null
  acknowledgedAt?: Date | null
  respondingBy?: string | null
  respondingAt?: Date | null
  resolvedBy?: string | null
  resolvedAt?: Date | null
  resolutionNotes?: string | null
  createdAt?: Date
  updatedAt?: Date
}

const emergencyAlertSchema =
  new Schema<IEmergencyAlert>(
    {
      apartmentId: {
        type: Schema.Types.ObjectId,
        ref: "Apartment",
        required: true,
        index: true,
      },

      residentId: {
        type: Schema.Types.ObjectId,
        ref: "Resident",
        required: true,
        index: true,
      },

      flatId: {
        type: Schema.Types.ObjectId,
        ref: "Flat",
        required: true,
        index: true,
      },

      alertType: {
        type: String,
        enum: Object.values(EmergencyAlertType),
        default: EmergencyAlertType.SOS,
        required: true,
      },

      message: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      status: {
        type: String,
        enum: Object.values(EmergencyAlertStatus),
        default: EmergencyAlertStatus.ACTIVE,
        required: true,
        index: true,
      },

      triggeredBy: {
        type: String,
        required: true,
      },

      triggeredAt: {
        type: Date,
        default: Date.now,
        required: true,
      },

      acknowledgedBy: {
        type: String,
        default: null,
      },

      acknowledgedAt: {
        type: Date,
        default: null,
      },

      respondingBy: {
        type: String,
        default: null,
      },

      respondingAt: {
        type: Date,
        default: null,
      },

      resolvedBy: {
        type: String,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  )

emergencyAlertSchema.index({
  apartmentId: 1,
  status: 1,
  triggeredAt: -1,
})

emergencyAlertSchema.index({
  apartmentId: 1,
  residentId: 1,
  triggeredAt: -1,
})

export const EmergencyAlertModel: Model<IEmergencyAlert> =
  mongoose.models.EmergencyAlert ||
  mongoose.model<IEmergencyAlert>(
    "EmergencyAlert",
    emergencyAlertSchema
  )
