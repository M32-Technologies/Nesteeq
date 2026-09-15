import { Schema, model, type InferSchemaType } from "mongoose";

export const complaintCategories = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "SECURITY",
  "LIFT",
  "WATER",
  "MAINTENANCE",
  "OTHER",
] as const;

export const complaintPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const complaintStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const;

export const complaintApprovalStatuses = ["APPROVED", "REJECTED"] as const;
export const residentConfirmationStatuses = ["PENDING", "CONFIRMED"] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintPriority = (typeof complaintPriorities)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintApprovalStatus = (typeof complaintApprovalStatuses)[number];
export type ResidentConfirmationStatus = (typeof residentConfirmationStatuses)[number];

const complaintRemarkSchema = new Schema(
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

const completionDetailsSchema = new Schema(
  {
    details: {
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

const approvalDetailsSchema = new Schema(
  {
    status: {
      type: String,
      enum: [...complaintApprovalStatuses],
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

const residentConfirmationSchema = new Schema(
  {
    status: {
      type: String,
      enum: [...residentConfirmationStatuses],
      default: null,
      index: true,
    },
    requestedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: String,
      trim: true,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  { _id: false }
);

const complaintSchema = new Schema(
  {
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
    category: {
      type: String,
      enum: [...complaintCategories],
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
      enum: [...complaintStatuses],
      required: true,
      default: "PENDING",
      index: true,
    },
    assignedStaff: {
      type: String,
      trim: true,
      default: null,
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
    remarks: {
      type: [complaintRemarkSchema],
      default: [],
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
    completionDetails: {
      type: completionDetailsSchema,
      default: null,
    },
    approvalDetails: {
      type: approvalDetailsSchema,
      default: null,
    },
    residentConfirmation: {
      type: residentConfirmationSchema,
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
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
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
  },
  { timestamps: true }
);

complaintSchema.index({ resident: 1, createdAt: -1 });
complaintSchema.index({ apartment: 1, status: 1, createdAt: -1 });
complaintSchema.index({ assignedStaff: 1, status: 1, createdAt: -1 });

export type ComplaintDocument = InferSchemaType<typeof complaintSchema>;

export const Complaint = model("Complaint", complaintSchema);