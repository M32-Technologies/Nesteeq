import mongoose, { Schema, model, type InferSchemaType } from "mongoose";
import { complaintCategories } from "../complaint/complaint.model.js";

export const technicianStatuses = ["ACTIVE", "BUSY", "ON_LEAVE", "INACTIVE"] as const;

export type TechnicianStatus = (typeof technicianStatuses)[number];
export type TechnicianSpecialization = (typeof complaintCategories)[number];

const technicianSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 180,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },
    apartmentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 40,
      default: null,
    },
    specializations: {
      type: [
        {
          type: String,
          enum: [...complaintCategories],
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: [...technicianStatuses],
      required: true,
      default: "ACTIVE",
      index: true,
    },
    shift: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    deactivatedBy: {
      type: String,
      trim: true,
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

technicianSchema.index({ apartmentId: 1, status: 1, fullName: 1 });
technicianSchema.index({ specializations: 1, status: 1 });

export type TechnicianDocument = InferSchemaType<typeof technicianSchema>;

export const Technician =
  mongoose.models.Technician || model("Technician", technicianSchema);
