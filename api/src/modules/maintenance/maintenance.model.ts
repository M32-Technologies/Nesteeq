import { Schema, model, type InferSchemaType } from "mongoose";
import {
  complaintCategories,
  complaintPriorities,
} from "../complaint/complaint.model.js";

export const maintenanceStatuses = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const;

export const maintenanceApprovalStatuses = ["APPROVED", "REJECTED"] as const;
export const maintenanceCostStatuses = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;

export type MaintenanceCategory = (typeof complaintCategories)[number];
export type MaintenancePriority = (typeof complaintPriorities)[number];
export type MaintenanceStatus = (typeof maintenanceStatuses)[number];
export type MaintenanceApprovalStatus = (typeof maintenanceApprovalStatuses)[number];
export type MaintenanceCostStatus = (typeof maintenanceCostStatuses)[number];

const maintenanceNoteSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
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

const maintenanceProgressSchema = new Schema(
  {
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: [...maintenanceStatuses],
      required: true,
    },
    remarks: {
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

const maintenanceCompletionSchema = new Schema(
  {
    details: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    workNotes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    completedBy: {
      type: String,
      trim: true,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const maintenanceApprovalSchema = new Schema(
  {
    status: {
      type: String,
      enum: [...maintenanceApprovalStatuses],
      default: null,
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  { _id: false }
);

const maintenanceCostReviewSchema = new Schema(
  {
    status: {
      type: String,
      enum: [...maintenanceCostStatuses],
      default: "NOT_SUBMITTED",
      index: true,
    },
    submittedAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    submittedBy: {
      type: String,
      trim: true,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    forwardedToRole: {
      type: String,
      trim: true,
      default: null,
    },
    forwardedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const maintenanceSchema = new Schema(
  {
    complaint: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    resident: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    apartment: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    flat: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    assignedStaff: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: [...complaintCategories],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
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
      enum: [...maintenanceStatuses],
      required: true,
      default: "PENDING",
      index: true,
    },
    assignedBy: {
      type: String,
      trim: true,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedCost: {
      type: Number,
      min: 0,
      default: null,
    },
    finalCost: {
      type: Number,
      min: 0,
      default: null,
    },
    progressUpdates: {
      type: [maintenanceProgressSchema],
      default: [],
    },
    workNotes: {
      type: [maintenanceNoteSchema],
      default: [],
    },
    completionDetails: {
      type: maintenanceCompletionSchema,
      default: null,
    },
    managerRemarks: {
      type: [maintenanceNoteSchema],
      default: [],
    },
    approvalDetails: {
      type: maintenanceApprovalSchema,
      default: null,
    },
    costReview: {
      type: maintenanceCostReviewSchema,
      default: () => ({ status: "NOT_SUBMITTED" }),
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
    closedBy: {
      type: String,
      trim: true,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
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

maintenanceSchema.index({ complaint: 1, status: 1 });
maintenanceSchema.index({ apartment: 1, status: 1, createdAt: -1 });
maintenanceSchema.index({ assignedStaff: 1, status: 1, createdAt: -1 });
maintenanceSchema.index({ resident: 1, createdAt: -1 });

export type MaintenanceDocument = InferSchemaType<typeof maintenanceSchema>;

export const Maintenance = model("Maintenance", maintenanceSchema);
