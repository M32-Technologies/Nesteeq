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

export interface GetAnnouncementsResponse {
  announcements: AnnouncementResponse[];
  pagination: AnnouncementPagination;
}

export interface AnnouncementFilterQuery {
  apartmentId: Types.ObjectId;
  type?: AnnouncementType;
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
