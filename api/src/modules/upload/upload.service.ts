import crypto from "crypto";
import path from "path";
import { Types } from "mongoose";
import { AppError } from "../../utils/AppError.js";
import { S3Service } from "./s3.service.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { Complaint } from "../complaint/complaint.model.js";
import type { AuthUser } from "../../types/express.js";
import {
  DEFAULT_UPLOAD_EXPIRY_SECONDS,
  DEFAULT_READ_EXPIRY_SECONDS,
  type UploadPurpose,
  type PresignedUrlRequestItem,
  type PresignedUrlResultItem,
} from "./upload.types.js";

export interface GeneratePresignedUrlOptions {
  user: AuthUser;
  purpose: UploadPurpose;
  fileName: string;
  contentType: string;
  fileSize?: number;
  apartmentId?: string;
  complaintId?: string;
  maintenanceId?: string;
}

export interface GenerateBatchPresignedUrlsOptions {
  user: AuthUser;
  purpose: UploadPurpose;
  files: PresignedUrlRequestItem[];
  apartmentId?: string;
  complaintId?: string;
  maintenanceId?: string;
}

export class UploadService {
  /**
   * Validates user authorization based on upload purpose and resource context.
   */
  private static async authorizeUpload(
    user: AuthUser,
    purpose: UploadPurpose,
    context: {
      apartmentId?: string;
      complaintId?: string;
      maintenanceId?: string;
    },
  ): Promise<{ resolvedApartmentId?: string; resolvedResourceSubpath?: string }> {
    const userRole = (user.role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const userApartmentId = user.apartmentId;

    switch (purpose) {
      case "avatar": {
        // Authenticated users can only request upload URLs for their own avatar
        return {};
      }

      case "complaint": {
        const targetApartmentId = context.apartmentId || userApartmentId;
        if (!targetApartmentId) {
          throw new AppError("Apartment context is required for complaint uploads", 400);
        }

        // If complaintId is supplied, verify it exists and belongs to the user's apartment
        if (context.complaintId) {
          const complaint = await Complaint.findById(context.complaintId).select(
            "apartment resident residentId",
          );
          if (!complaint) {
            throw new AppError("Complaint not found", 404);
          }

          if (complaint.apartment?.toString() !== targetApartmentId) {
            throw new AppError("Complaint does not belong to this apartment", 403);
          }

          // If resident, verify they created it
          if (
            (userRole === "resident" || userRole === "owner" || userRole === "tenant") &&
            complaint.resident !== user.id &&
            complaint.residentId?.toString() !== user.id
          ) {
            throw new AppError("You can only upload images to your own complaints", 403);
          }

          return {
            resolvedApartmentId: targetApartmentId,
            resolvedResourceSubpath: context.complaintId,
          };
        }

        // When creating a complaint (draft before document creation),
        // explicitly scope under draft folder for the user
        return {
          resolvedApartmentId: targetApartmentId,
          resolvedResourceSubpath: `drafts/${user.id}`,
        };
      }

      case "maintenance_before":
      case "maintenance_after":
      case "maintenance_expense": {
        if (!context.maintenanceId) {
          throw new AppError(`maintenanceId is required for purpose '${purpose}'`, 400);
        }

        const maint = await Maintenance.findById(context.maintenanceId).select(
          "apartment assignedStaff assignedTo technician status",
        );

        if (!maint) {
          throw new AppError("Maintenance job not found", 404);
        }

        const targetApartmentId = maint.apartment.toString();

        // Enforce technician assignment authorization:
        // Technician A cannot upload files for a task assigned strictly to Technician B
        if (userRole === "maintenance_technician") {
          const assignedIds = [
            maint.assignedStaff?.toString(),
            maint.assignedTo?.toString(),
            maint.technician?.toString(),
          ].filter(Boolean);

          const isAssigned = assignedIds.includes(user.id);

          if (!isAssigned) {
            throw new AppError("You are not assigned to this maintenance job", 403);
          }
        } else if (
          userRole !== "property_manager" &&
          userRole !== "facility_manager" &&
          userRole !== "admin" &&
          userRole !== "super_admin"
        ) {
          throw new AppError("You do not have permission to upload maintenance evidence", 403);
        }

        return {
          resolvedApartmentId: targetApartmentId,
          resolvedResourceSubpath: context.maintenanceId,
        };
      }

      case "document": {
        const targetApartmentId = context.apartmentId || userApartmentId;
        if (!targetApartmentId) {
          throw new AppError("Apartment context is required for document uploads", 400);
        }

        if (
          userRole !== "property_manager" &&
          userRole !== "facility_manager" &&
          userRole !== "treasurer" &&
          userRole !== "admin" &&
          userRole !== "super_admin"
        ) {
          throw new AppError("Only management staff can upload apartment documents", 403);
        }

        return {
          resolvedApartmentId: targetApartmentId,
        };
      }

      default:
        throw new AppError(`Unsupported upload purpose '${purpose}'`, 400);
    }
  }

  /**
   * Generates a predictable, secure S3 object key.
   */
  private static generateObjectKey(
    userId: string,
    purpose: UploadPurpose,
    fileName: string,
    context: {
      apartmentId?: string;
      resourceSubpath?: string;
    },
  ): string {
    const ext = path.extname(fileName).replace(/^\./, "").toLowerCase() || "jpg";
    const uuid = crypto.randomUUID();

    switch (purpose) {
      case "avatar":
        return `users/${userId}/avatar/${uuid}.${ext}`;

      case "complaint":
        return `apartments/${context.apartmentId}/complaints/${context.resourceSubpath}/${uuid}.${ext}`;

      case "maintenance_before":
        return `apartments/${context.apartmentId}/maintenance/${context.resourceSubpath}/before/${uuid}.${ext}`;

      case "maintenance_after":
        return `apartments/${context.apartmentId}/maintenance/${context.resourceSubpath}/after/${uuid}.${ext}`;

      case "maintenance_expense":
        return `apartments/${context.apartmentId}/maintenance/${context.resourceSubpath}/expense/${uuid}.${ext}`;

      case "document":
        return `apartments/${context.apartmentId}/documents/${uuid}.${ext}`;

      default:
        return `uploads/${uuid}.${ext}`;
    }
  }

  /**
   * Generates a single presigned PUT upload URL.
   */
  static async getPresignedUploadUrl(
    options: GeneratePresignedUrlOptions,
  ): Promise<PresignedUrlResultItem> {
    const { user, purpose, fileName, contentType } = options;

    const { resolvedApartmentId, resolvedResourceSubpath } = await this.authorizeUpload(
      user,
      purpose,
      {
        apartmentId: options.apartmentId,
        complaintId: options.complaintId,
        maintenanceId: options.maintenanceId,
      },
    );

    const key = this.generateObjectKey(user.id, purpose, fileName, {
      apartmentId: resolvedApartmentId,
      resourceSubpath: resolvedResourceSubpath,
    });

    const expiresIn = DEFAULT_UPLOAD_EXPIRY_SECONDS;
    const uploadUrl = await S3Service.generatePresignedPutUrl(key, contentType, expiresIn);

    return {
      key,
      uploadUrl,
      expiresIn,
    };
  }

  /**
   * Generates multiple presigned PUT upload URLs in a single request.
   */
  static async getBatchPresignedUploadUrls(
    options: GenerateBatchPresignedUrlsOptions,
  ): Promise<PresignedUrlResultItem[]> {
    const { user, purpose, files } = options;

    const { resolvedApartmentId, resolvedResourceSubpath } = await this.authorizeUpload(
      user,
      purpose,
      {
        apartmentId: options.apartmentId,
        complaintId: options.complaintId,
        maintenanceId: options.maintenanceId,
      },
    );

    const expiresIn = DEFAULT_UPLOAD_EXPIRY_SECONDS;

    const results = await Promise.all(
      files.map(async (file) => {
        const key = this.generateObjectKey(user.id, purpose, file.fileName, {
          apartmentId: resolvedApartmentId,
          resourceSubpath: resolvedResourceSubpath,
        });

        const uploadUrl = await S3Service.generatePresignedPutUrl(
          key,
          file.contentType,
          expiresIn,
        );

        return {
          key,
          uploadUrl,
          expiresIn,
        };
      }),
    );

    return results;
  }

  /**
   * Generates a temporary presigned GET URL for viewing private S3 files.
   * Enforces deep resource-level authorization.
   */
  static async getViewUrl(user: AuthUser, key: string): Promise<{ viewUrl: string; expiresIn: number }> {
    const userRole = (user.role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const userApartmentId = user.apartmentId;
    const isPlatformAdmin = userRole === "admin" || userRole === "super_admin";

    if (!isPlatformAdmin) {
      // 1. User avatar: users/{userId}/avatar/...
      if (key.startsWith("users/")) {
        // Avatars are community profile images visible to authenticated users
      }
      // 2. Apartment scoped files: apartments/{apartmentId}/{module}/{resourceId}/...
      else if (key.startsWith("apartments/")) {
        const parts = key.split("/");
        const fileApartmentId = parts[1];
        const moduleType = parts[2];
        const resourceId = parts[3];

        if (!userApartmentId || userApartmentId !== fileApartmentId) {
          throw new AppError("You do not have permission to view files for this apartment", 403);
        }

        // Resource-level verification for complaints
        if (moduleType === "complaints") {
          if (resourceId === "drafts") {
            const draftOwnerId = parts[4];
            if (draftOwnerId !== user.id && userRole !== "property_manager" && userRole !== "facility_manager") {
              throw new AppError("You do not have permission to view this complaint draft", 403);
            }
          } else if (Types.ObjectId.isValid(resourceId)) {
            const complaint = await Complaint.findById(resourceId).select("apartment resident residentId");
            if (!complaint) {
              throw new AppError("Complaint not found", 404);
            }

            if (
              (userRole === "resident" || userRole === "owner" || userRole === "tenant") &&
              complaint.resident !== user.id &&
              complaint.residentId?.toString() !== user.id
            ) {
              throw new AppError("You do not have permission to view files for this complaint", 403);
            }
          }
        }
        // Resource-level verification for maintenance
        else if (moduleType === "maintenance") {
          if (Types.ObjectId.isValid(resourceId)) {
            const maint = await Maintenance.findById(resourceId).select(
              "apartment assignedStaff assignedTo technician resident",
            );
            if (!maint) {
              throw new AppError("Maintenance job not found", 404);
            }

            if (userRole === "maintenance_technician") {
              const assignedIds = [
                maint.assignedStaff?.toString(),
                maint.assignedTo?.toString(),
                maint.technician?.toString(),
              ].filter(Boolean);

              if (!assignedIds.includes(user.id)) {
                throw new AppError("You are not assigned to this maintenance task", 403);
              }
            } else if (userRole === "resident" || userRole === "owner" || userRole === "tenant") {
              if (maint.resident !== user.id) {
                throw new AppError("You do not have permission to view this maintenance record", 403);
              }
            }
          }
        }
      } else {
        throw new AppError("Invalid or unauthorized file key", 400);
      }
    }

    const expiresIn = DEFAULT_READ_EXPIRY_SECONDS;
    const viewUrl = await S3Service.generatePresignedGetUrl(key, expiresIn);

    return {
      viewUrl,
      expiresIn,
    };
  }

  /**
   * Deletes a file from S3 with strict ownership / management authorization.
   */
  static async deleteFile(user: AuthUser, key: string): Promise<void> {
    const userRole = (user.role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const isPlatformAdmin = userRole === "admin" || userRole === "super_admin";

    if (!isPlatformAdmin) {
      if (key.startsWith("users/")) {
        const parts = key.split("/");
        const avatarUserId = parts[1];
        if (avatarUserId !== user.id) {
          throw new AppError("You can only delete your own avatar", 403);
        }
      } else if (key.startsWith("apartments/")) {
        const parts = key.split("/");
        const fileApartmentId = parts[1];
        const moduleType = parts[2];
        const resourceId = parts[3];

        if (user.apartmentId !== fileApartmentId) {
          throw new AppError("You cannot delete files from another apartment", 403);
        }

        if (moduleType === "complaints") {
          if (resourceId === "drafts") {
            const draftOwnerId = parts[4];
            if (draftOwnerId !== user.id && userRole !== "property_manager") {
              throw new AppError("You can only delete your own draft files", 403);
            }
          } else if (Types.ObjectId.isValid(resourceId)) {
            const complaint = await Complaint.findById(resourceId).select("resident residentId");
            const isOwner =
              complaint && (complaint.resident === user.id || complaint.residentId?.toString() === user.id);
            const isManager = userRole === "property_manager" || userRole === "facility_manager";

            if (!isOwner && !isManager) {
              throw new AppError("You do not have permission to delete files from this complaint", 403);
            }
          }
        } else if (moduleType === "maintenance") {
          const isManager = userRole === "property_manager" || userRole === "facility_manager";
          if (!isManager && userRole !== "maintenance_technician") {
            throw new AppError("You do not have permission to delete maintenance files", 403);
          }
        }
      } else {
        throw new AppError("Invalid or unauthorized file key", 400);
      }
    }

    await S3Service.deleteObject(key);
  }
}
