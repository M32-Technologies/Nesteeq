import type { Types } from "mongoose";
import type {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementType,
} from "./announcements.model.js";

export interface CreatorSummary {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
}

export interface TargetBlockSummary {
  id: string;
  blockname: string;
  code: string;
}

export interface AnnouncementResponse {
  id: string;
  apartmentId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetIds: string[];
  targetBlocks?: TargetBlockSummary[];
  createdBy: string;
  creator?: CreatorSummary | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export interface GetAnnouncementsResponse {
  announcements: AnnouncementResponse[];
  pagination: AnnouncementPagination;
  stats?: AnnouncementStats;
}

export interface AnnouncementFilterQuery {
  apartmentId: Types.ObjectId;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  targetType?: AnnouncementTargetType;
  $or?: Array<{ title?: RegExp; message?: RegExp }>;
  expiresAt?: { $gt: Date } | null | { $ne: null };
}

export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  targetType?: AnnouncementTargetType;
  targetIds?: string[];
  expiresAt?: string | null;
}

export interface UpdateAnnouncementStatusInput {
  status: AnnouncementStatus;
}

export const EmergencyAlertCategory = {
  FIRE: "FIRE",
  GAS_LEAK: "GAS_LEAK",
  MEDICAL: "MEDICAL",
  SECURITY: "SECURITY",
  WEATHER: "WEATHER",
  INFRASTRUCTURE: "INFRASTRUCTURE",
  WATER_CONTAMINATION: "WATER_CONTAMINATION",
  OTHER: "OTHER",
} as const;

export type EmergencyAlertCategory =
  (typeof EmergencyAlertCategory)[keyof typeof EmergencyAlertCategory];

export interface EmergencyBroadcastInput {
  category: EmergencyAlertCategory;
  title: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetIds?: string[];
  actionInstructions?: string;
  contactPhone?: string;
}

export interface EmergencyBroadcastResponse {
  id: string;
  apartmentId: string;
  category: EmergencyAlertCategory;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetBlocks?: TargetBlockSummary[];
  actionInstructions?: string;
  contactPhone?: string;
  createdBy: string;
  publishedAt: Date;
  estimatedAudience: {
    residentsCount: number;
    flatsCount: number;
  };
}
