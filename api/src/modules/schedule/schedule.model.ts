import mongoose, { Schema, model, type InferSchemaType } from "mongoose";
import { complaintPriorities } from "../complaint/complaint.model.js";

export const scheduleStatuses = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
] as const;

export const scheduleWorkTypes = ["complaint", "maintenance"] as const;

export type ScheduleStatus = (typeof scheduleStatuses)[number];
export type ScheduleWorkType = (typeof scheduleWorkTypes)[number];
export type SchedulePriority = (typeof complaintPriorities)[number];

const scheduleHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [...scheduleStatuses],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    by: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const scheduleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    technician: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
      index: true,
    },
    technicianUserId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    workType: {
      type: String,
      enum: [...scheduleWorkTypes],
      required: true,
      index: true,
    },
    complaint: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
      index: true,
    },
    maintenance: {
      type: Schema.Types.ObjectId,
      ref: "Maintenance",
      default: null,
      index: true,
    },
    apartment: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    flat: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: [...complaintPriorities],
      required: true,
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: [...scheduleStatuses],
      required: true,
      default: "SCHEDULED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    completionDetails: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    cancelledBy: {
      type: String,
      trim: true,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [scheduleHistorySchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ technician: 1, startAt: 1, endAt: 1, status: 1 });
scheduleSchema.index({ technicianUserId: 1, scheduledDate: 1, status: 1 });
scheduleSchema.index({ apartment: 1, scheduledDate: 1, status: 1 });

export type ScheduleDocument = InferSchemaType<typeof scheduleSchema>;

export const Schedule =
  mongoose.models.Schedule || model("Schedule", scheduleSchema);
