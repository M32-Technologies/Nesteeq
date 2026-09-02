import mongoose, {
  Schema,
  type Model,
} from "mongoose"

import {
  DeliveryStatus,
  DeliveryType,
  type ISecurityDelivery,
} from "./delivery.interface.js"

const securityDeliverySchema =
  new Schema<ISecurityDelivery>(
    {
      apartmentId: {
        type: Schema.Types.ObjectId,
        ref: "Apartment",
        required: true,
        index: true,
      },

      flatId: {
        type: Schema.Types.ObjectId,
        ref: "Flat",
        required: true,
        index: true,
      },

      residentId: {
        type: Schema.Types.ObjectId,
        ref: "Resident",
        default: null,
        index: true,
      },

      deliveryType: {
        type: String,
        enum: Object.values(DeliveryType),
        required: true,
      },

      deliveryCompany: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      deliveryPersonName: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      deliveryPersonPhone: {
        type: String,
        trim: true,
        maxlength: 20,
        default: null,
      },

      trackingId: {
        type: String,
        trim: true,
        maxlength: 80,
        default: null,
      },

      packageDescription: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      status: {
        type: String,
        enum: Object.values(DeliveryStatus),
        default: DeliveryStatus.WAITING,
        required: true,
        index: true,
      },

      receivedBy: {
        type: String,
        required: true,
      },

      receivedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },

      notifiedBy: {
        type: String,
        default: null,
      },

      notifiedAt: {
        type: Date,
        default: null,
      },

      collectedBy: {
        type: String,
        default: null,
      },

      collectedAt: {
        type: Date,
        default: null,
      },

      returnedBy: {
        type: String,
        default: null,
      },

      returnedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  )

securityDeliverySchema.index({
  apartmentId: 1,
  status: 1,
  receivedAt: -1,
})

securityDeliverySchema.index({
  apartmentId: 1,
  flatId: 1,
  receivedAt: -1,
})

securityDeliverySchema.index({
  apartmentId: 1,
  trackingId: 1,
})

export const SecurityDeliveryModel: Model<ISecurityDelivery> =
  mongoose.models.SecurityDelivery ||
  mongoose.model<ISecurityDelivery>(
    "SecurityDelivery",
    securityDeliverySchema
  )
