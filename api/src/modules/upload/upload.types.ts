export const UPLOAD_PURPOSES = [
  "avatar",
  "complaint",
  "maintenance_before",
  "maintenance_after",
  "maintenance_expense",
  "document",
] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const DEFAULT_UPLOAD_EXPIRY_SECONDS = 300; // 5 minutes
export const DEFAULT_READ_EXPIRY_SECONDS = 900; // 15 minutes

export const UPLOAD_LIMITS: Record<UploadPurpose, number> = {
  avatar: 5 * 1024 * 1024, // 5 MB
  complaint: 10 * 1024 * 1024, // 10 MB
  maintenance_before: 10 * 1024 * 1024, // 10 MB
  maintenance_after: 10 * 1024 * 1024, // 10 MB
  maintenance_expense: 10 * 1024 * 1024, // 10 MB
  document: 20 * 1024 * 1024, // 20 MB
} as const;

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DOCUMENT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

export const getAllowedMimeTypesForPurpose = (purpose: UploadPurpose): readonly string[] => {
  if (purpose === "document" || purpose === "maintenance_expense") {
    return DOCUMENT_ATTACHMENT_MIME_TYPES;
  }
  return IMAGE_MIME_TYPES;
};

export interface PresignedUrlRequestItem {
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export interface PresignedUrlResultItem {
  key: string;
  uploadUrl: string;
  expiresIn: number;
}
