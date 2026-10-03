import { z } from "zod";
import path from "path";
import {
  UPLOAD_PURPOSES,
  UPLOAD_LIMITS,
  getAllowedMimeTypesForPurpose,
  MIME_TO_EXTENSIONS,
} from "./upload.types.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const fileItemSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, "fileName is required")
      .max(255, "fileName is too long"),
    contentType: z
      .string()
      .trim()
      .min(1, "contentType is required")
      .toLowerCase(),
    fileSize: z
      .number()
      .int()
      .positive("fileSize must be a positive integer")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const ext = path.extname(data.fileName).replace(/^\./, "").toLowerCase();
    const validExts = MIME_TO_EXTENSIONS[data.contentType];

    if (!validExts || !validExts.includes(ext)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileName"],
        message: `File extension '.${ext || "unknown"}' does not match contentType '${data.contentType}'`,
      });
    }
  });

export const getPresignedUrlSchema = z.object({
  body: z
    .object({
      purpose: z.enum([...UPLOAD_PURPOSES]),
      fileName: z
        .string()
        .trim()
        .min(1, "fileName is required")
        .max(255, "fileName is too long"),
      contentType: z
        .string()
        .trim()
        .min(1, "contentType is required")
        .toLowerCase(),
      fileSize: z
        .number()
        .int()
        .positive("fileSize must be a positive integer")
        .optional(),
      apartmentId: objectIdSchema.optional(),
      complaintId: objectIdSchema.optional(),
      maintenanceId: objectIdSchema.optional(),
    })
    .superRefine((data, ctx) => {
      // 1. Validate content type for purpose
      const allowedMimes = getAllowedMimeTypesForPurpose(data.purpose);
      if (!allowedMimes.includes(data.contentType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contentType"],
          message: `ContentType '${data.contentType}' is not permitted for purpose '${data.purpose}'. Allowed: ${allowedMimes.join(", ")}`,
        });
      }

      // 2. Validate extension matches contentType
      const ext = path.extname(data.fileName).replace(/^\./, "").toLowerCase();
      const validExts = MIME_TO_EXTENSIONS[data.contentType];
      if (validExts && !validExts.includes(ext)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fileName"],
          message: `File extension '.${ext || "unknown"}' does not match contentType '${data.contentType}'`,
        });
      }

      // 3. Early validation of file size against centralized limit
      if (data.fileSize !== undefined) {
        const maxLimit = UPLOAD_LIMITS[data.purpose];
        if (data.fileSize > maxLimit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["fileSize"],
            message: `File size ${data.fileSize} bytes exceeds the maximum limit of ${maxLimit} bytes (${Math.round(maxLimit / 1024 / 1024)}MB) for '${data.purpose}'`,
          });
        }
      }

      // 4. Require maintenanceId for maintenance purposes
      if (
        (data.purpose === "maintenance_before" ||
          data.purpose === "maintenance_after" ||
          data.purpose === "maintenance_expense") &&
        !data.maintenanceId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maintenanceId"],
          message: `maintenanceId is required for purpose '${data.purpose}'`,
        });
      }
    }),
});

export const getBatchPresignedUrlsSchema = z.object({
  body: z
    .object({
      purpose: z.enum([...UPLOAD_PURPOSES]),
      apartmentId: objectIdSchema.optional(),
      complaintId: objectIdSchema.optional(),
      maintenanceId: objectIdSchema.optional(),
      files: z.array(fileItemSchema).min(1, "At least one file is required"),
    })
    .superRefine((data, ctx) => {
      // Purpose limit on batch size
      const maxFiles = data.purpose === "avatar" ? 1 : 5;
      if (data.files.length > maxFiles) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["files"],
          message: `A maximum of ${maxFiles} file(s) can be requested for purpose '${data.purpose}'`,
        });
      }

      const allowedMimes = getAllowedMimeTypesForPurpose(data.purpose);
      const maxLimit = UPLOAD_LIMITS[data.purpose];

      data.files.forEach((file, index) => {
        if (!allowedMimes.includes(file.contentType)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["files", index, "contentType"],
            message: `ContentType '${file.contentType}' is not permitted for purpose '${data.purpose}'. Allowed: ${allowedMimes.join(", ")}`,
          });
        }

        if (file.fileSize !== undefined && file.fileSize > maxLimit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["files", index, "fileSize"],
            message: `File size exceeds the limit of ${maxLimit} bytes (${Math.round(maxLimit / 1024 / 1024)}MB) for '${data.purpose}'`,
          });
        }
      });

      if (
        (data.purpose === "maintenance_before" ||
          data.purpose === "maintenance_after" ||
          data.purpose === "maintenance_expense") &&
        !data.maintenanceId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maintenanceId"],
          message: `maintenanceId is required for purpose '${data.purpose}'`,
        });
      }
    }),
});

export const getViewUrlSchema = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(1, "S3 object key is required")
      .max(500, "S3 object key is too long"),
  }),
});

export const deleteFileSchema = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(1, "S3 object key is required")
      .max(500, "S3 object key is too long"),
  }),
});
