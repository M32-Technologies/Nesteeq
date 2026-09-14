import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export const AnnouncementType = {
  GENERAL: "GENERAL",
  EMERGENCY: "EMERGENCY",
} as const;

export type AnnouncementType =
  (typeof AnnouncementType)[keyof typeof AnnouncementType];

export const AnnouncementTargetType = {
  ALL_RESIDENTS: "ALL_RESIDENTS",
  BLOCK: "BLOCK",
} as const;

export type AnnouncementTargetType =
  (typeof AnnouncementTargetType)[keyof typeof AnnouncementTargetType];

export const AnnouncementPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type AnnouncementPriority =
  (typeof AnnouncementPriority)[keyof typeof AnnouncementPriority];

export const AnnouncementStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type AnnouncementStatus = (typeof AnnouncementStatus)[keyof typeof AnnouncementStatus];

export interface IAnnouncement {
  apartmentId: Types.ObjectId;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetIds?: string[];
  createdBy: string;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: Object.values(AnnouncementType),
      required: true,
      default: AnnouncementType.GENERAL,
      index: true,
    },

    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      required: true,
      default: AnnouncementPriority.NORMAL,
    },

    status: {
      type: String,
      enum: Object.values(AnnouncementStatus),
      required: true,
      default: AnnouncementStatus.PUBLISHED,
      index: true,
    },

    targetType: {
      type: String,
      enum: Object.values(AnnouncementTargetType),
      required: true,
    },

    targetIds: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast query: "Show all published announcements for this apartment, newest first"
announcementSchema.index({ apartmentId: 1, status: 1, createdAt: -1 });

// Fast query: "Show all emergency announcements for this apartment"
announcementSchema.index({ apartmentId: 1, type: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);