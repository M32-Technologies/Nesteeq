import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

export const notificationTypes = [
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

export const notificationSeverities = ["INFO", "SUCCESS", "WARNING", "ERROR"] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type NotificationSeverity = (typeof notificationSeverities)[number];

const notificationSchema = new Schema(
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
      enum: [...notificationTypes],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: [...notificationSeverities],
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

notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, apartment: 1, readAt: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;

export const Notification =
  mongoose.models.Notification || model("Notification", notificationSchema);
