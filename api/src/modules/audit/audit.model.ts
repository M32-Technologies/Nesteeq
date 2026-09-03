import mongoose, { Schema } from "mongoose";

import {
  AuditAction,
  IAudit,
} from "./audit.interface.js";

const auditSchema = new Schema<IAudit>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    performedBy: {
      type: String,
      trim: true,
    },

    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    oldValue: {
      type: Schema.Types.Mixed,
    },

    newValue: {
      type: Schema.Types.Mixed,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

auditSchema.index({
  apartmentId: 1,
  createdAt: -1,
});

export const Audit = mongoose.model<IAudit>(
  "Audit",
  auditSchema
);
