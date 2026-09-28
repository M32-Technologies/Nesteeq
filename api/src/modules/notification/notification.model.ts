import { Schema, model, type HydratedDocument } from "mongoose";

import {
  notificationTypes,
  notificationSeverities,
  type INotification,
} from "./notification.types.js";

const notificationSchema = new Schema<INotification>(
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
      enum: notificationTypes,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: notificationSeverities,
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

export type NotificationDocument = HydratedDocument<INotification>;

export const Notification = model<INotification>("Notification", notificationSchema);
