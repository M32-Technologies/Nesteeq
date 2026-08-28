import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

export const alertTypes = [
  "NEW_COMPLAINT",
  "TASK_ASSIGNED",
  "MAINTENANCE_STATUS_UPDATED",
  "WORK_COMPLETED",
  "COST_SUBMITTED",
  "COST_APPROVED",
  "COST_REJECTED",
  "RESIDENT_CONFIRMATION_REQUESTED",
  "RESIDENT_CONFIRMATION_RECEIVED",
  "SCHEDULE_CREATED",
  "SCHEDULE_UPDATED",
  "SCHEDULE_CANCELLED",
] as const;

export const alertSeverities = ["INFO", "SUCCESS", "WARNING", "ERROR"] as const;

export type AlertType = (typeof alertTypes)[number];
export type AlertSeverity = (typeof alertSeverities)[number];

const alertSchema = new Schema(
  {
    apartment: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    recipientUserId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [...alertTypes],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: [...alertSeverities],
      required: true,
      default: "INFO",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    relatedResourceType: {
      type: String,
      trim: true,
      default: null,
    },
    relatedResourceId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
alertSchema.index({ recipientRole: 1, apartment: 1, readAt: 1, createdAt: -1 });

export type AlertDocument = InferSchemaType<typeof alertSchema>;

export const Alert = mongoose.models.Alert || model("Alert", alertSchema);
